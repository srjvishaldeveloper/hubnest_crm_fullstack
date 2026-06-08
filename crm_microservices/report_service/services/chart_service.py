import io
import base64
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

def fig_to_base64(fig):
    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight', dpi=120)
    buf.seek(0)
    img_bytes = buf.read()
    plt.close(fig)
    return base64.b64encode(img_bytes).decode('utf-8')

def generate_line_chart(data, title, x_key, y_key):
    fig, ax = plt.subplots(figsize=(6, 3))
    x_vals = [d[x_key] for d in data]
    y_vals = [d[y_key] for d in data]
    ax.plot(x_vals, y_vals, marker='o', color='#2563EB', linewidth=2.5, markersize=5)
    ax.set_title(title, fontsize=10, fontweight='bold', color='#1E293B', pad=10)
    ax.grid(True, linestyle='--', alpha=0.3)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color('#E2E8F0')
    ax.spines['bottom'].set_color('#E2E8F0')
    ax.tick_params(axis='both', colors='#64748B', labelsize=8)
    return {"chart_base64": fig_to_base64(fig), "type": "png"}

def generate_bar_chart(data, title, x_key, y_key):
    fig, ax = plt.subplots(figsize=(6, 3))
    x_vals = [d[x_key] for d in data]
    y_vals = [d[y_key] for d in data]
    ax.bar(x_vals, y_vals, color='#2563EB', width=0.4, edgecolor='#1D4ED8', alpha=0.9, zorder=3)
    ax.set_title(title, fontsize=10, fontweight='bold', color='#1E293B', pad=10)
    ax.grid(True, linestyle='--', alpha=0.3, zorder=0)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color('#E2E8F0')
    ax.spines['bottom'].set_color('#E2E8F0')
    ax.tick_params(axis='both', colors='#64748B', labelsize=8)
    return {"chart_base64": fig_to_base64(fig), "type": "png"}

def generate_pie_chart(data, title):
    fig, ax = plt.subplots(figsize=(5, 3.5))
    labels = list(data.keys())
    values = list(data.values())
    colors = ['#2563EB', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444']
    colors = colors[:len(labels)]
    ax.pie(values, labels=labels, autopct='%1.1f%%', startangle=90, colors=colors, 
           textprops={'fontsize': 8, 'color': '#1E293B', 'weight': 'semibold'})
    ax.set_title(title, fontsize=10, fontweight='bold', color='#1E293B', pad=10)
    return {"chart_base64": fig_to_base64(fig), "type": "png"}

def generate_funnel_chart(stages):
    fig, ax = plt.subplots(figsize=(6, 3.5))
    labels = list(stages.keys())
    values = list(stages.values())
    
    max_val = max(values) if values else 1
    widths = [v / max_val for v in values]
    
    y_pos = range(len(labels))
    left_positions = [(1 - w) / 2 for w in widths]
    
    colors = ['#1E3A8A', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE']
    colors = colors[:len(labels)]
    
    ax.barh(y_pos, widths, left=left_positions, color=colors, height=0.6, align='center', edgecolor='none')
    ax.set_yticks(y_pos)
    ax.set_yticklabels(labels, fontsize=8, color='#1E293B', fontweight='semibold')
    
    for i, (val, left, w) in enumerate(zip(values, left_positions, widths)):
        ax.text(0.5, i, f"{val}", ha='center', va='center', color='white', fontsize=8, fontweight='bold')
        
    ax.set_title("Sales Pipeline Funnel", fontsize=10, fontweight='bold', color='#1E293B', pad=10)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_visible(False)
    ax.spines['bottom'].set_visible(False)
    ax.xaxis.set_visible(False)
    ax.invert_yaxis()
    return {"chart_base64": fig_to_base64(fig), "type": "png"}

def generate_donut_chart(data, title):
    fig, ax = plt.subplots(figsize=(5, 3.5))
    labels = list(data.keys())
    values = list(data.values())
    colors = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6']
    colors = colors[:len(labels)]
    
    ax.pie(values, labels=labels, autopct='%1.0f%%', startangle=90, 
           colors=colors, pctdistance=0.75,
           textprops={'fontsize': 8, 'color': '#1E293B', 'weight': 'semibold'},
           wedgeprops=dict(width=0.35, edgecolor='w', linewidth=2))
                                      
    ax.set_title(title, fontsize=10, fontweight='bold', color='#1E293B', pad=10)
    return {"chart_base64": fig_to_base64(fig), "type": "png"}
