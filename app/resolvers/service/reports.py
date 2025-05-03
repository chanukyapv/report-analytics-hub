
from ariadne import convert_kwargs_to_snake_case
from fastapi import HTTPException, status
from datetime import datetime
import os
import math
from app.auth import get_current_user, sd_user_required, admin_required
from app.db.mongodb import (
    weekly_reports_collection, metrics_collection,
    serialize_doc, serialize_docs
)
from app.utils.export import export_to_format
from bson.objectid import ObjectId

@convert_kwargs_to_snake_case
async def weekly_reports_resolver(_, info, fy=None, quarter=None, week_date=None):
    context = info.context
    request = context["request"]

    # Get the Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = auth_header.split(" ")[1]
    user = await get_current_user(token)

    # Check if user has service dashboard access
    sd_user_required(user)

    # Build query
    query = {}
    if fy:
        query["fy"] = fy
    if quarter:
        query["quarter"] = quarter
    if week_date:
        query["week_date"] = week_date

    # Get weekly reports
    reports = list(weekly_reports_collection.find(query).sort("week_date", -1))
    
    return serialize_docs(reports)

@convert_kwargs_to_snake_case
async def weekly_report_resolver(_, info, id):
    context = info.context
    request = context["request"]

    # Get the Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = auth_header.split(" ")[1]
    user = await get_current_user(token)

    # Check if user has service dashboard access
    sd_user_required(user)

    # Get weekly report by ID
    report = weekly_reports_collection.find_one({"_id": ObjectId(id)})
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Weekly report with ID {id} not found"
        )

    # Enhance report with metric information
    for metric_value in report["metrics"]:
        metric_id = metric_value["metric_id"]
        metric = metrics_collection.find_one({"_id": ObjectId(metric_id)})
        if metric:
            metric_value["baseline"] = metric["baseline"]
            metric_value["target"] = metric["target"]
            metric_value["unit"] = metric["unit"]

            # Calculate status
            if metric_value["value"] >= metric["target"]:
                metric_value["status"] = "green"
            elif metric_value["value"] >= metric["baseline"]:
                metric_value["status"] = "amber"
            else:
                metric_value["status"] = "red"
                
            # For formulas, calculate quarter actual
            if "actual_formula" in metric:
                metric_value["actual_formula"] = metric["actual_formula"]
                
                # Simple formula for quarter actual (example)
                # In a real app, this would be more sophisticated
                metric_value["quarter_actual"] = metric_value["value"] * 13

    return serialize_doc(report)

@convert_kwargs_to_snake_case
async def create_weekly_report_resolver(_, info, input):
    context = info.context
    request = context["request"]

    # Get the Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = auth_header.split(" ")[1]
    user = await get_current_user(token)

    # Check if user is admin
    admin_required(user)

    # Extract input fields
    fy = input.get("fy")
    quarter = input.get("quarter")
    week_date = input.get("week_date")
    metrics = input.get("metrics")

    # Check if week_date is in correct format
    try:
        # Check if already in DD-MM-YYYY format
        day, month, year = week_date.split('-')
        int(day), int(month), int(year)  # Just to check if they are valid integers
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="week_date must be in DD-MM-YYYY format"
        )
    
    # Check if report for this week already exists
    if weekly_reports_collection.find_one({"week_date": week_date, "fy": fy, "quarter": quarter}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Report for week {week_date} already exists"
        )

    # Create report
    current_time = datetime.now()
    report_data = {
        "fy": fy,
        "quarter": quarter,
        "week_date": week_date,
        "metrics": metrics,
        "created_by": user["_id"],
        "created_at": current_time,
        "updated_at": current_time
    }
    result = weekly_reports_collection.insert_one(report_data)
    report = weekly_reports_collection.find_one({"_id": result.inserted_id})
    
    return serialize_doc(report)

@convert_kwargs_to_snake_case
async def update_weekly_report_resolver(_, info, id, input):
    context = info.context
    request = context["request"]

    # Get the Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = auth_header.split(" ")[1]
    user = await get_current_user(token)

    # Check if user is admin
    admin_required(user)

    # Extract input fields
    fy = input.get("fy")
    quarter = input.get("quarter")
    week_date = input.get("week_date")
    metrics = input.get("metrics")

    # Check if report exists
    report = weekly_reports_collection.find_one({"_id": ObjectId(id)})
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Weekly report with ID {id} not found"
        )

    # Check if another report for this week exists
    duplicate = weekly_reports_collection.find_one({
        "week_date": week_date,
        "fy": fy,
        "quarter": quarter,
        "_id": {"$ne": ObjectId(id)}
    })
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Another report for week {week_date} already exists"
        )

    # Update report
    weekly_reports_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": {
            "fy": fy,
            "quarter": quarter,
            "week_date": week_date,
            "metrics": metrics,
            "updated_at": datetime.now()
        }}
    )

    # Get updated report
    updated_report = weekly_reports_collection.find_one({"_id": ObjectId(id)})
    
    return serialize_doc(updated_report)

@convert_kwargs_to_snake_case
async def delete_weekly_report_resolver(_, info, id):
    context = info.context
    request = context["request"]

    # Get the Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = auth_header.split(" ")[1]
    user = await get_current_user(token)

    # Check if user is admin
    admin_required(user)

    # Check if report exists
    report = weekly_reports_collection.find_one({"_id": ObjectId(id)})
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Weekly report with ID {id} not found"
        )

    # Delete report
    weekly_reports_collection.delete_one({"_id": ObjectId(id)})
    
    return True

async def quarterly_reports_resolver(_, info, fy=None, quarter=None):
    context = info.context
    request = context["request"]

    # Get the Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = auth_header.split(" ")[1]
    user = await get_current_user(token)

    # Check if user has service dashboard access
    sd_user_required(user)

    # Build query
    query = {}
    if fy:
        query["fy"] = fy
    if quarter:
        query["quarter"] = quarter

    # Get all metrics first
    all_metrics = {str(metric["_id"]): metric for metric in metrics_collection.find()}
    
    # Get weekly reports for the quarters
    reports = list(weekly_reports_collection.find(query).sort("week_date", 1))
    
    if not reports:
        return []
    
    # Group by quarter
    quarters = {}
    for report in reports:
        quarter_key = f"{report['fy']}-{report['quarter']}"
        if quarter_key not in quarters:
            quarters[quarter_key] = {
                "fy": report["fy"],
                "quarter": report["quarter"],
                "metrics": {}
            }
        
        # Add metrics to quarter
        for metric_value in report["metrics"]:
            metric_id = metric_value["metric_id"]
            value = metric_value["value"]
            
            if metric_id not in quarters[quarter_key]["metrics"]:
                # Initialize with first value
                metric_info = all_metrics.get(metric_id, {})
                quarters[quarter_key]["metrics"][metric_id] = {
                    "metric_id": metric_id,
                    "name": metric_info.get("name", "Unknown Metric"),
                    "values": [value],
                    "comments": [metric_value.get("comment", "")],
                    "baseline": metric_info.get("baseline", 0),
                    "target": metric_info.get("target", 0),
                    "unit": metric_info.get("unit", ""),
                    "actual_formula": metric_info.get("actual_formula", "")
                }
            else:
                # Add to existing values
                quarters[quarter_key]["metrics"][metric_id]["values"].append(value)
                quarters[quarter_key]["metrics"][metric_id]["comments"].append(metric_value.get("comment", ""))
    
    # Calculate average for each metric in each quarter
    quarterly_reports = []
    for quarter_key, quarter_data in quarters.items():
        metrics_list = []
        for metric_id, metric_data in quarter_data["metrics"].items():
            values = metric_data["values"]
            if values:
                avg_value = sum(values) / len(values)
                
                # Create metric value for quarterly report
                metrics_list.append({
                    "metric_id": metric_id,
                    "name": metric_data["name"],
                    "value": avg_value,
                    "comment": " | ".join(filter(None, metric_data["comments"])),
                    "baseline": metric_data["baseline"],
                    "target": metric_data["target"],
                    "unit": metric_data["unit"],
                    # For quarterly reports, calculate a synthetic "quarter_actual"
                    "quarter_actual": avg_value * 13  # Simple example formula
                })
        
        quarterly_reports.append({
            "fy": quarter_data["fy"],
            "quarter": quarter_data["quarter"],
            "metrics": metrics_list
        })
    
    return quarterly_reports

@convert_kwargs_to_snake_case
async def export_report_resolver(_, info, input):
    context = info.context
    request = context["request"]

    # Get the Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = auth_header.split(" ")[1]
    user = await get_current_user(token)

    # Check if user has service dashboard access
    sd_user_required(user)

    # Extract input fields
    fy = input.get("fy")
    quarter = input.get("quarter")
    week_date = input.get("week_date")
    format_type = input.get("format")
    
    # Build query
    query = {"fy": fy}
    if quarter:
        query["quarter"] = quarter
    if week_date:
        query["week_date"] = week_date
    
    # Get reports
    reports = list(weekly_reports_collection.find(query).sort("week_date", 1))
    if not reports:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No reports found for the specified criteria"
        )
    
    # Get all metrics
    all_metrics = {str(metric["_id"]): metric for metric in metrics_collection.find()}
    
    # Enhance reports with metric information
    for report in reports:
        for metric_value in report["metrics"]:
            metric_id = metric_value["metric_id"]
            if metric_id in all_metrics:
                metric = all_metrics[metric_id]
                metric_value["name"] = metric["name"]
                metric_value["baseline"] = metric["baseline"]
                metric_value["target"] = metric["target"]
                metric_value["unit"] = metric["unit"]

                # Calculate status
                if metric_value["value"] >= metric["target"]:
                    metric_value["status"] = "green"
                elif metric_value["value"] >= metric["baseline"]:
                    metric_value["status"] = "amber"
                else:
                    metric_value["status"] = "red"
    
    # Get title
    title = f"Service Dashboard Report - FY {fy}"
    if quarter:
        title += f", Quarter {quarter}"
    if week_date:
        title += f", Week {week_date}"
    
    # Export to requested format
    export_dir = os.environ.get("EXPORT_DIR", "./exports")
    filename = f"{fy}_Q{quarter}_report".replace(" ", "_")
    if week_date:
        filename += f"_W{week_date.replace('-', '_')}"
    
    file_url = export_to_format(reports, format_type, export_dir, filename, title, all_metrics)
    
    return {"url": file_url}

async def service_metric_dashboard_resolver(_, info):
    context = info.context
    request = context["request"]

    # Get the Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = auth_header.split(" ")[1]
    user = await get_current_user(token)

    # Check if user has service dashboard access
    sd_user_required(user)

    # Get the latest report
    latest_report = list(weekly_reports_collection.find().sort("week_date", -1).limit(1))
    if not latest_report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No reports found"
        )
    
    latest_report = latest_report[0]
    
    # Extract date info
    week_date = latest_report["week_date"]
    fy = latest_report["fy"]
    quarter = latest_report["quarter"]
    
    # Determine week number (simplified example)
    try:
        day, month, year = map(int, week_date.split('-'))
        week_number = math.ceil(day / 7)  # Simple heuristic
    except Exception:
        week_number = 1
    
    # Prepare week info
    week_info = {
        "date": week_date,
        "fy": fy,
        "quarter": quarter,
        "weekNumber": week_number
    }
    
    # Get all metrics
    all_metrics = {str(metric["_id"]): metric for metric in metrics_collection.find()}
    
    # Enhance metrics with additional data
    metrics_data = []
    statuses = {"green": 0, "amber": 0, "red": 0}
    
    for metric_value in latest_report["metrics"]:
        metric_id = metric_value["metric_id"]
        if metric_id in all_metrics:
            metric = all_metrics[metric_id]
            enhanced_metric = {
                "metric_id": metric_id,
                "name": metric["name"],
                "value": metric_value["value"],
                "comment": metric_value.get("comment", ""),
                "baseline": metric["baseline"],
                "target": metric["target"],
                "unit": metric["unit"]
            }
            
            # Calculate status
            if metric_value["value"] >= metric["target"]:
                status = "green"
            elif metric_value["value"] >= metric["baseline"]:
                status = "amber"
            else:
                status = "red"
            
            enhanced_metric["status"] = status
            statuses[status] += 1
            
            # Calculate quarter actual
            enhanced_metric["quarter_actual"] = metric_value["value"] * 13  # Simple example formula
            
            metrics_data.append(enhanced_metric)
    
    # Prepare summary
    summary = {
        "total": len(metrics_data),
        "green": statuses["green"],
        "amber": statuses["amber"],
        "red": statuses["red"]
    }
    
    return {
        "weekInfo": week_info,
        "report": metrics_data,
        "summary": summary
    }
