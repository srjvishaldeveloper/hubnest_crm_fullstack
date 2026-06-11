import sys
import json
import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

def generate_invoice(data, output_path):
    c = canvas.Canvas(output_path, pagesize=letter)
    width, height = letter
    
    # Header
    c.setFont("Helvetica-Bold", 24)
    c.drawString(50, height - 50, "INVOICE")
    
    # Invoice Details
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 80, f"Invoice Number: {data.get('invoiceNumber', 'N/A')}")
    c.drawString(50, height - 100, f"Date: {data.get('issuedDate', 'N/A')}")
    c.drawString(50, height - 120, f"Due Date: {data.get('dueDate', 'N/A')}")
    c.drawString(50, height - 140, f"Status: {data.get('status', 'N/A').upper()}")
    
    # Bill To
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, height - 180, "Bill To:")
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 200, f"Tenant: {data.get('tenantName', data.get('tenant', 'N/A'))}")
    
    # Items (Mockup if not provided)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 250, "Description")
    c.drawString(450, height - 250, "Amount")
    
    c.line(50, height - 260, 550, height - 260)
    
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 280, "Software Subscription Services")
    amount_str = f"{data.get('amount', 0)} {data.get('currency', 'USD')}"
    c.drawString(450, height - 280, amount_str)
    
    c.line(50, height - 300, 550, height - 300)
    
    # Total
    c.setFont("Helvetica-Bold", 14)
    c.drawString(350, height - 330, "Total:")
    c.drawString(450, height - 330, amount_str)
    
    # Footer
    c.setFont("Helvetica", 10)
    c.drawString(50, 50, "Thank you for your business!")
    
    c.save()

if __name__ == "__main__":
    try:
        if len(sys.argv) < 3:
            print("Usage: python generate_invoice.py '<json_data>' <output_path>")
            sys.exit(1)
            
        json_data = sys.argv[1]
        output_path = sys.argv[2]
        
        data = json.loads(json_data)
        generate_invoice(data, output_path)
        print("SUCCESS")
    except Exception as e:
        print(f"ERROR: {str(e)}")
        sys.exit(1)
