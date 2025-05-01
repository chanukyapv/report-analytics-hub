
from ariadne import convert_kwargs_to_snake_case
from fastapi import HTTPException, status
from bson import ObjectId
from datetime import datetime
import pandas as pd
import io
import os
import uuid
from app.db.mongodb import (
    weekly_reports_collection,
    metrics_collection,
    report_drafts_collection
)
from app.auth import get_current_user, admin_required

async def weekly_reports_resolver(_, info, fy=None, quarter=None, week_date=None):
    context = info.context
    request = context["request"]

    # Get the Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    token = auth_header.split(" ")[1]
    user = await get_current_user(token)

    # Build query based on filters
    query = {}
    if fy:
        query["fy"] = fy
    if quarter:
        query["quarter"] = quarter
    if week_date:
        query["week_date"] = week_date

    # Get reports
    reports = list(weekly_reports_collection.find(query).sort("week_date", -1))
    
    # Process reports
    for report in reports:
        report["id"] = str(report["_id"])
        del report["_id"]
        
        # Convert any ObjectIds to strings
        report["created_by"] = str(report["created_by"])

    return reports

@convert_kwargs_to_snake_case
async def weekly_report_resolver(_, info, id):
    context = info.context
    request = context["request"]

    # Get the Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    token = auth_header.split(" ")[1]
    user = await get_current_user(token)

    # Get report
    try:
        report = weekly_reports_collection.find_one({"_id": ObjectId(id)})
        if not report:
            return None
        
        report["id"] = str(report["_id"])
        del report["_id"]
        
        # Convert any ObjectIds to strings
        report["created_by"] = str(report["created_by"])
        
        return report
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid ID format: {str(e)}"
        )

async def quarterly_reports_resolver(_, info, fy=None, quarter=None):
    context = info.context
    request = context["request"]

    # Get the Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    token = auth_header.split(" ")[1]
    user = await get_current_user(token)

    # Build query based on filters
    query = {}
    if fy:
        query["fy"] = fy
    if quarter:
        query["quarter"] = quarter

    # Get weekly reports for the quarter
    weekly_reports = list(weekly_reports_collection.find(query))
    
    # Group metrics by quarter and calculate averages/totals
    quarterly_data = {}
    
    for report in weekly_reports:
        key = f"{report['fy']}_{report['quarter']}"
        
        if key not in quarterly_data:
            quarterly_data[key] = {
                "fy": report["fy"],
                "quarter": report["quarter"],
                "metrics_data": {}
            }
            
        # Process metrics in this report
        for metric in report["metrics"]:
            metric_id = metric["metric_id"]
            
            if metric_id not in quarterly_data[key]["metrics_data"]:
                quarterly_data[key]["metrics_data"][metric_id] = {
                    "values": [],
                    "name": metric["name"],
                    "baseline": metric["baseline"],
                    "target": metric["target"],
                    "unit": metric["unit"]
                }
                
            quarterly_data[key]["metrics_data"][metric_id]["values"].append(metric["value"])
    
    # Convert to list of quarterly reports
    result = []
    
    for key, data in quarterly_data.items():
        metrics = []
        
        for metric_id, metric_data in data["metrics_data"].items():
            # Calculate average value for the metric across all weekly reports
            avg_value = sum(metric_data["values"]) / len(metric_data["values"]) if metric_data["values"] else 0
            
            metrics.append({
                "metric_id": metric_id,
                "name": metric_data["name"],
                "value": avg_value,
                "baseline": metric_data["baseline"],
                "target": metric_data["target"],
                "unit": metric_data["unit"],
                "comment": f"Average of {len(metric_data['values'])} weekly reports"
            })
        
        result.append({
            "fy": data["fy"],
            "quarter": data["quarter"],
            "metrics": metrics
        })
    
    return result

@convert_kwargs_to_snake_case
async def create_weekly_report_resolver(_, info, input):
    context = info.context
    request = context["request"]

    # Get the Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    token = auth_header.split(" ")[1]
    user = await get_current_user(token)
    
    # Only admin can create reports
    admin_required(user)
    
    # Check if a report for this week already exists
    existing_report = weekly_reports_collection.find_one({
        "fy": input["fy"],
        "quarter": input["quarter"],
        "week_date": input["week_date"]
    })
    
    if existing_report:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A report for FY {input['fy']}, {input['quarter']}, week ending {input['week_date']} already exists"
        )
    
    # Fetch metric details to include in the report
    metrics_data = []
    for metric_value in input["metrics"]:
        metric_id = metric_value["metric_id"]
        metric = metrics_collection.find_one({"_id": ObjectId(metric_id)})
        
        if not metric:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Metric with ID {metric_id} not found"
            )
        
        # Calculate status
        value = metric_value["value"]
        baseline = metric["baseline"]
        target = metric["target"]
        
        status = "green" if value >= target else ("amber" if value > baseline else "red")
        
        metrics_data.append({
            "metric_id": metric_id,
            "name": metric["name"],
            "value": value,
            "comment": metric_value.get("comment", ""),
            "baseline": baseline,
            "target": target,
            "unit": metric["unit"],
            "status": status
        })
    
    # Create report
    report_data = {
        "fy": input["fy"],
        "quarter": input["quarter"],
        "week_date": input["week_date"],
        "metrics": metrics_data,
        "created_by": ObjectId(user["_id"]),
        "created_at": datetime.utcnow(),
        "updated_at": None
    }
    
    result = weekly_reports_collection.insert_one(report_data)
    
    # Clean up any drafts
    report_drafts_collection.delete_many({
        "fy": input["fy"],
        "quarter": input["quarter"],
        "week_date": input["week_date"],
        "created_by": ObjectId(user["_id"])
    })
    
    # Return created report
    report = weekly_reports_collection.find_one({"_id": result.inserted_id})
    report["id"] = str(report["_id"])
    del report["_id"]
    report["created_by"] = str(report["created_by"])
    
    return report

@convert_kwargs_to_snake_case
async def update_weekly_report_resolver(_, info, id, input):
    context = info.context
    request = context["request"]

    # Get the Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    token = auth_header.split(" ")[1]
    user = await get_current_user(token)
    
    # Only admin can update reports
    admin_required(user)
    
    # Check if report exists
    report = weekly_reports_collection.find_one({"_id": ObjectId(id)})
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID {id} not found"
        )
    
    # Check if changing to a week that already has a report
    if (input["fy"] != report["fy"] or 
        input["quarter"] != report["quarter"] or 
        input["week_date"] != report["week_date"]):
        
        existing_report = weekly_reports_collection.find_one({
            "fy": input["fy"],
            "quarter": input["quarter"],
            "week_date": input["week_date"],
            "_id": {"$ne": ObjectId(id)}
        })
        
        if existing_report:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A report for FY {input['fy']}, {input['quarter']}, week ending {input['week_date']} already exists"
            )
    
    # Fetch metric details to include in the report
    metrics_data = []
    for metric_value in input["metrics"]:
        metric_id = metric_value["metric_id"]
        metric = metrics_collection.find_one({"_id": ObjectId(metric_id)})
        
        if not metric:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Metric with ID {metric_id} not found"
            )
        
        # Calculate status
        value = metric_value["value"]
        baseline = metric["baseline"]
        target = metric["target"]
        
        status = "green" if value >= target else ("amber" if value > baseline else "red")
        
        metrics_data.append({
            "metric_id": metric_id,
            "name": metric["name"],
            "value": value,
            "comment": metric_value.get("comment", ""),
            "baseline": baseline,
            "target": target,
            "unit": metric["unit"],
            "status": status
        })
    
    # Update report
    updated_data = {
        "fy": input["fy"],
        "quarter": input["quarter"],
        "week_date": input["week_date"],
        "metrics": metrics_data,
        "updated_at": datetime.utcnow()
    }
    
    weekly_reports_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": updated_data}
    )
    
    # Return updated report
    updated_report = weekly_reports_collection.find_one({"_id": ObjectId(id)})
    updated_report["id"] = str(updated_report["_id"])
    del updated_report["_id"]
    updated_report["created_by"] = str(updated_report["created_by"])
    
    return updated_report

@convert_kwargs_to_snake_case
async def delete_weekly_report_resolver(_, info, id):
    context = info.context
    request = context["request"]

    # Get the Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    token = auth_header.split(" ")[1]
    user = await get_current_user(token)
    
    # Only admin can delete reports
    admin_required(user)
    
    # Check if report exists
    report = weekly_reports_collection.find_one({"_id": ObjectId(id)})
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID {id} not found"
        )
    
    # Delete report
    result = weekly_reports_collection.delete_one({"_id": ObjectId(id)})
    
    if result.deleted_count == 1:
        return True
    return False

@convert_kwargs_to_snake_case
async def export_report_resolver(_, info, input):
    context = info.context
    request = context["request"]

    # Get the Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    token = auth_header.split(" ")[1]
    user = await get_current_user(token)
    
    # Build query
    query = {"fy": input["fy"]}
    if input.get("quarter"):
        query["quarter"] = input["quarter"]
    if input.get("week_date"):
        query["week_date"] = input["week_date"]
    
    # Get reports
    reports = list(weekly_reports_collection.find(query))
    
    if not reports:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No reports found with the provided criteria"
        )
    
    # Process data for export
    export_data = []
    
    for report in reports:
        for metric in report["metrics"]:
            export_data.append({
                "FY": report["fy"],
                "Quarter": report["quarter"],
                "Week Date": report["week_date"],
                "Metric Name": metric["name"],
                "Value": metric["value"],
                "Baseline": metric["baseline"],
                "Target": metric["target"],
                "Unit": metric["unit"],
                "Status": metric.get("status", ""),
                "Comment": metric.get("comment", "")
            })
    
    # Create DataFrame
    df = pd.DataFrame(export_data)
    
    # Export format
    export_format = input.get("format", "csv").lower()
    
    # Define file path for saving exports
    export_dir = os.environ.get("EXPORT_DIR", "./exports")
    os.makedirs(export_dir, exist_ok=True)
    
    file_uuid = str(uuid.uuid4())
    
    # Export based on format
    if export_format == "csv":
        file_path = f"{export_dir}/report_{file_uuid}.csv"
        df.to_csv(file_path, index=False)
        file_url = f"/downloads/report_{file_uuid}.csv"
        
    elif export_format == "excel" or export_format == "xlsx":
        file_path = f"{export_dir}/report_{file_uuid}.xlsx"
        
        # Create Excel writer with formatting
        with pd.ExcelWriter(file_path, engine='xlsxwriter') as writer:
            df.to_excel(writer, sheet_name='Report', index=False)
            
            # Get workbook and worksheet objects
            workbook = writer.book
            worksheet = writer.sheets['Report']
            
            # Add formats
            header_format = workbook.add_format({
                'bold': True,
                'bg_color': '#D3D3D3',
                'border': 1
            })
            
            # Format headers
            for col_num, value in enumerate(df.columns.values):
                worksheet.write(0, col_num, value, header_format)
            
            # Auto-fit columns
            for i, col in enumerate(df.columns):
                max_len = max(df[col].astype(str).apply(len).max(), len(str(col))) + 2
                worksheet.set_column(i, i, max_len)
            
        file_url = f"/downloads/report_{file_uuid}.xlsx"
        
    elif export_format == "pdf":
        file_path = f"{export_dir}/report_{file_uuid}.pdf"
        
        # Use a styling library for PDF
        styled_df = df.style.set_properties(**{
            'font-size': '10pt',
            'border-color': 'black',
            'border-style': 'solid',
            'border-width': '1px'
        })
        
        # Custom PDF styling
        html = styled_df.to_html()
        
        # Use a PDF conversion library like WeasyPrint or ReportLab
        # This is a placeholder - you'll need to implement the actual PDF conversion
        # Example with WeasyPrint
        # from weasyprint import HTML
        # HTML(string=html).write_pdf(file_path)
        
        # For now, let's just create a simple HTML file
        with open(file_path.replace('.pdf', '.html'), 'w') as f:
            f.write(html)
        
        file_url = f"/downloads/report_{file_uuid}.html"
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported export format: {export_format}"
        )
    
    return {"url": file_url}

# Service Metrics Dashboard resolver
async def service_metric_dashboard_resolver(_, info):
    context = info.context
    request = context["request"]

    # Get the Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    token = auth_header.split(" ")[1]
    user = await get_current_user(token)
    
    # Get the latest report
    latest_report = list(weekly_reports_collection.find().sort("week_date", -1).limit(1))
    
    if not latest_report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No reports found"
        )
    
    latest_report = latest_report[0]
    
    # Extract metrics for the dashboard
    metrics = latest_report["metrics"]
    
    # Calculate summary statistics
    total = len(metrics)
    green = sum(1 for m in metrics if m.get("status") == "green")
    amber = sum(1 for m in metrics if m.get("status") == "amber")
    red = sum(1 for m in metrics if m.get("status") == "red")
    
    # Week info
    week_info = {
        "date": latest_report["week_date"],
        "fy": latest_report["fy"],
        "quarter": latest_report["quarter"],
        "weekNumber": 0  # You might want to calculate the week number
    }
    
    # Summary
    summary = {
        "total": total,
        "green": green,
        "amber": amber,
        "red": red
    }
    
    return {
        "weekInfo": week_info,
        "report": metrics,
        "summary": summary
    }
