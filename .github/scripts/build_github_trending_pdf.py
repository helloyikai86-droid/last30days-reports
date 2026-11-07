#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Convert the public GitHub business-opportunity Markdown report to a phone-sized PDF."""
from __future__ import annotations
import re
import sys
from pathlib import Path
from fpdf import FPDF

def font_path() -> str:
    files=[
        "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc",
        "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    ]
    for name in files:
        if Path(name).exists():
            if name.endswith(".ttc"):
                # fpdf2 expects a single font, not a TrueType Collection;
                # extract collection member 0 with fontTools.
                from fontTools.ttLib import TTCollection
                ttf = Path("/tmp/github_business_cjk.ttf")
                collection = TTCollection(name)
                collection.fonts[0].save(str(ttf))
                return str(ttf)
            return name
    raise RuntimeError("Missing CJK font. Install fonts-wqy-microhei.")

class Report(FPDF):
    def __init__(self, *args, report_day="当日", **kwargs):
        super().__init__(*args, **kwargs)
        self.report_day = report_day

    def header(self):
        self.set_font("CJK", size=8)
        self.set_text_color(110,125,145)
        self.cell(0, 5, f"GitHub 商业机会 · {self.report_day}", align="R", new_x="LMARGIN", new_y="NEXT")
        self.ln(2)
    def footer(self):
        self.set_y(-12)
        self.set_font("CJK", size=8)
        self.set_text_color(128,140,154)
        self.cell(0, 5, f"公开研究日报  ·  第 {self.page_no()} / {{nb}} 页", align="C")

def plain(s):
    s=re.sub(r"!\[([^\]]*)\]\([^)]*\)", r"\1", s)
    s=re.sub(r"\[([^\]]+)\]\((https?://[^)]*)\)", r"\1（\2）", s)
    s=s.replace("**", "").replace("__","").replace("`","")
    return s.strip()

def main():
    src, dst=map(Path, sys.argv[1:3])
    txt=src.read_text(encoding="utf-8")
    day=re.search(r"(20\d\d-\d\d-\d\d)", src.name)
    day=day.group(1) if day else "当日"
    pdf=Report(orientation="P",unit="mm",format="A5",report_day=day)
    pdf.set_title(f"GitHub 商业机会 Top 10｜{day}")
    pdf.set_author("GitHub Business Opportunities")
    pdf.set_auto_page_break(auto=True,margin=15)
    pdf.set_margins(11,14,11)
    pdf.add_font("CJK",fname=font_path())
    pdf.alias_nb_pages()
    pdf.add_page()
    in_table=False
    for line in txt.splitlines():
        s=line.strip()
        if not s:
            pdf.ln(2)
            in_table=False
            continue
        if re.match(r"^\|\s*:?-{2,}",s) or re.match(r"^\|[-:| ]+\|$",s):
            continue
        match=re.match(r"^(#{1,5})\s+(.+)",s)
        if match:
            rank=len(match.group(1))
            size={1:17,2:13,3:11.2,4:10,5:9.5}[rank]
            pad={1:6,2:5,3:4,4:3,5:2}[rank]
            pdf.ln(pad)
            pdf.set_font("CJK",size=size)
            pdf.set_text_color(20,48,78)
            pdf.multi_cell(0,size*0.56,text=plain(match.group(2)),new_x="LMARGIN",new_y="NEXT")
            pdf.ln(1)
            continue
        if s.startswith("|") and s.endswith("|"):
            cols=[plain(x) for x in s.strip("|").split("|")]
            if all(not c or set(c)<=set("-: ") for c in cols): continue
            s="  ·  ".join(cols)
            pdf.set_font("CJK",size=8.2)
            pdf.set_text_color(38,65,87)
            pdf.multi_cell(0,4.7,text=s,new_x="LMARGIN",new_y="NEXT")
            in_table=True
            continue
        if s.startswith(">"):
            s=s[1:].strip()
            pdf.set_text_color(75,95,118)
            pdf.set_font("CJK",size=9.2)
            pdf.multi_cell(0,5.5,text=plain(s),new_x="LMARGIN",new_y="NEXT")
            continue
        if s.startswith("- "):
            s="• "+s[2:]
        pdf.set_text_color(28,41,56)
        pdf.set_font("CJK",size=9.2)
        s=plain(s)
        if s:
            pdf.multi_cell(0,5.3,text=s,new_x="LMARGIN",new_y="NEXT")
    dst.parent.mkdir(parents=True,exist_ok=True)
    pdf.output(dst)
    print("PDF created",dst,"bytes",dst.stat().st_size,"pages",pdf.page_no())

if __name__=="__main__":
    main()

