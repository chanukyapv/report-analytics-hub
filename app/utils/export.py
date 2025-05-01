
import pandas as pd
import os
import uuid

def create_excel_report(data, file_path):
    """Create formatted Excel report with appropriate column widths and styling"""
    df = pd.DataFrame(data)
    
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
        
        # Status cell formats
        green_format = workbook.add_format({'bg_color': '#C6EFCE', 'font_color': '#006100', 'border': 1})
        amber_format = workbook.add_format({'bg_color': '#FFEB9C', 'font_color': '#9C5700', 'border': 1})
        red_format = workbook.add_format({'bg_color': '#FFC7CE', 'font_color': '#9C0006', 'border': 1})
        
        # Format headers
        for col_num, value in enumerate(df.columns.values):
            worksheet.write(0, col_num, value, header_format)
        
        # Format status column if it exists
        if 'Status' in df.columns:
            status_col_idx = df.columns.get_loc('Status')
            
            # Apply conditional formatting
            for row_num, status in enumerate(df['Status'], 1):
                if status == 'green':
                    worksheet.write(row_num, status_col_idx, 'Green (Target Achieved)', green_format)
                elif status == 'amber':
                    worksheet.write(row_num, status_col_idx, 'Amber (Above Baseline)', amber_format)
                elif status == 'red':
                    worksheet.write(row_num, status_col_idx, 'Red (Below Baseline)', red_format)
        
        # Auto-fit columns
        for i, col in enumerate(df.columns):
            max_len = max(df[col].astype(str).apply(len).max(), len(str(col))) + 2
            worksheet.set_column(i, i, max_len)
            
        # Add sheet protection
        worksheet.protect('password123', options={'format_cells': True})

def create_pdf_report(data, file_path):
    """Create PDF report with proper formatting (this is a placeholder)"""
    df = pd.DataFrame(data)
    
    # Style DataFrame for PDF
    styled_df = df.style.set_properties(**{
        'font-size': '10pt',
        'border-color': 'black',
        'border-style': 'solid',
        'border-width': '1px'
    })
    
    # Add conditional formatting
    if 'Status' in df.columns:
        styled_df = styled_df.applymap(
            lambda x: 'background-color: #C6EFCE; color: #006100' if x == 'green' else
                     ('background-color: #FFEB9C; color: #9C5700' if x == 'amber' else
                      'background-color: #FFC7CE; color: #9C0006' if x == 'red' else ''),
            subset=['Status']
        )
    
    # Export to HTML with style
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Metrics Report</title>
        <style>
            body {{ font-family: Arial, sans-serif; }}
            table {{ border-collapse: collapse; width: 100%; margin: 20px 0; }}
            th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
            th {{ background-color: #f2f2f2; font-weight: bold; }}
            .green {{ background-color: #C6EFCE; color: #006100; }}
            .amber {{ background-color: #FFEB9C; color: #9C5700; }}
            .red {{ background-color: #FFC7CE; color: #9C0006; }}
            @media print {{
                @page {{ size: A4 landscape; margin: 1cm; }}
                table {{ page-break-inside: auto; }}
                tr {{ page-break-inside: avoid; page-break-after: auto; }}
            }}
        </style>
    </head>
    <body>
        <h1>Metrics Report</h1>
        {styled_df.to_html()}
    </body>
    </html>
    """
    
    # Write to HTML file (could be converted to PDF with a library)
    with open(file_path, 'w') as f:
        f.write(html_content)
    
    # TODO: For actual PDF conversion, you would use a library like WeasyPrint or ReportLab
    # from weasyprint import HTML
    # HTML(string=html_content).write_pdf(file_path)
