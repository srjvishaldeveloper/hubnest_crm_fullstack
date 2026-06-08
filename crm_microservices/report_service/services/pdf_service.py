import io
import base64
import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_pdf_report(title: str, data: dict, charts_base64_list: list = None):
    buffer = io.BytesIO()
    # 40pt margins around the letter sized page
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#1E3A8A'),
        alignment=1,
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#475569'),
        alignment=1,
        spaceAfter=20
    )
    
    header_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#1E3A8A'),
        spaceBefore=15,
        spaceAfter=10
    )
    
    body_style = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1E293B'),
        spaceAfter=8
    )

    story = []
    
    # 1. Header Section
    story.append(Spacer(1, 15))
    story.append(Paragraph("JOB NEST CRM EXECUTIVE REPORT", title_style))
    story.append(Paragraph(f"Module: {title}", subtitle_style))
    story.append(Paragraph(f"Generated: {datetime.datetime.now().strftime('%d %b %Y, %H:%M')}", subtitle_style))
    story.append(Spacer(1, 10))
    
    # 2. KPI Summary Grid
    story.append(Paragraph("Key Performance Indicators (KPIs)", header_style))
    kpis = data.get("kpis", {})
    if kpis:
        kpi_data = [["KPI Metric", "Value"]]
        for k, v in kpis.items():
            if isinstance(v, float) and "rate" not in k.lower():
                val_str = f"${v:,.2f}"
            else:
                val_str = str(v)
            kpi_data.append([k.replace("_", " ").title(), val_str])
            
        kpi_table = Table(kpi_data, colWidths=[240, 160])
        kpi_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E3A8A')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,0), 9),
            ('BOTTOMPADDING', (0,0), (-1,0), 6),
            ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#F8FAFC')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
            ('FONTSIZE', (0,1), (-1,-1), 8),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(kpi_table)
    story.append(Spacer(1, 15))
    
    # 3. Charts Visualization
    if charts_base64_list:
        story.append(Paragraph("Data Visualizations", header_style))
        for chart_b64 in charts_base64_list:
            try:
                chart_data = base64.b64decode(chart_b64)
                img_io = io.BytesIO(chart_data)
                img = Image(img_io, width=400, height=200)
                story.append(img)
                story.append(Spacer(1, 12))
            except Exception as e:
                print(f"Error drawing chart in PDF: {e}")
                
    # 4. Detailed Table
    table_rows = data.get("table_data", [])
    if table_rows:
        story.append(Paragraph("Detailed Data Sheet", header_style))
        cols = list(table_rows[0].keys())
        table_data = [[c.replace("_", " ").title() for c in cols]]
        for row in table_rows:
            table_data.append([str(row[c]) for c in cols])
            
        # Calculate matching widths
        col_w = 400 / len(cols)
        detail_table = Table(table_data, colWidths=[col_w] * len(cols))
        detail_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#2563EB')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,0), 8),
            ('BOTTOMPADDING', (0,0), (-1,0), 5),
            ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#F8FAFC')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('FONTSIZE', (0,1), (-1,-1), 8),
        ]))
        story.append(detail_table)
        
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
