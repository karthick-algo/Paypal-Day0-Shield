import os
import sys
import time
from playwright.sync_api import sync_playwright

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
os.makedirs(OUTPUT_DIR, exist_ok=True)

def run_demo():
    print(f"[DEMO RECORDING] Starting Playwright video recording session...")
    print(f"[DEMO RECORDING] Saving video to: {OUTPUT_DIR}")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
            ]
        )

        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            record_video_dir=OUTPUT_DIR,
            record_video_size={"width": 1440, "height": 900},
        )

        page = context.new_page()
        page.set_default_timeout(10000)

        def smooth_scroll(y_target, steps=8, delay=0.08):
            for i in range(1, steps + 1):
                page.evaluate(f"window.scrollTo(0, {y_target * (i / steps)})")
                time.sleep(delay)

        # -----------------------------------------------------------
        # SCENE 1: LOGIN PAGE
        # -----------------------------------------------------------
        print("[SCENE 1] Loading Login page...")
        page.goto("http://127.0.0.1:8080/login", wait_until="networkidle")
        time.sleep(2)

        # Fill credentials
        try:
            page.fill("#username", "admin")
            time.sleep(0.5)
            page.fill("#password", "admin123")
            time.sleep(0.8)
            page.click('button[type="submit"]')
        except Exception as e:
            print(f"[SCENE 1 Fallback] {e}")
            page.click('button:has-text("Log In to Protection Suite")')

        time.sleep(2.5)

        # -----------------------------------------------------------
        # SCENE 2: PROJECT DOSSIER & WORLDWIDE CORRIDORS MATRIX
        # -----------------------------------------------------------
        print("[SCENE 2] Navigating to Project Dossier...")
        page.goto("http://127.0.0.1:8080/documentation", wait_until="networkidle")
        time.sleep(2.5)

        # Showcase Tab 1: Problem Statement & Target Audience
        smooth_scroll(320, steps=6, delay=0.08)
        time.sleep(2)

        # Showcase Tab: Worldwide Trade Corridors
        print("[SCENE 2] Showing Worldwide Trade Corridors Matrix...")
        corridors_tab = page.locator('div[role="tab"]:has-text("Worldwide Trade Corridors")')
        if corridors_tab.count() > 0:
            corridors_tab.first.click()
            time.sleep(2)
            smooth_scroll(400, steps=5, delay=0.08)
            time.sleep(1.5)

        # Showcase Tab: Future Architecture Roadmap
        print("[SCENE 2] Showing Future Architecture Roadmap...")
        roadmap_tab = page.locator('div[role="tab"]:has-text("Future Architecture")')
        if roadmap_tab.count() > 0:
            roadmap_tab.first.click()
            time.sleep(1.8)
            smooth_scroll(380, steps=5, delay=0.08)
            time.sleep(1.5)

        page.evaluate("window.scrollTo(0, 0)")
        time.sleep(1)

        # -----------------------------------------------------------
        # SCENE 3: DASHBOARD & WORLDWIDE TELEMETRY IN A SINGLE ROW
        # -----------------------------------------------------------
        print("[SCENE 3] Navigating to Dashboard...")
        page.goto("http://127.0.0.1:8080/", wait_until="networkidle")
        time.sleep(2.5)

        # Smooth horizontal scroll across 15 Worldwide Corridors in ONE ROW
        print("[SCENE 3] Smooth scrolling across 15 Worldwide Trade Hubs in single row...")
        try:
            scroll_right = page.locator('button[title*="Scroll Right"]').first
            if scroll_right.count() > 0:
                scroll_right.click()
                time.sleep(1)
                scroll_right.click()
                time.sleep(1.5)
                scroll_left = page.locator('button[title*="Scroll Left"]').first
                if scroll_left.count() > 0:
                    scroll_left.click()
                    time.sleep(1)
            else:
                page.evaluate("const el = document.querySelector('div[style*=\"overflow\"]'); if(el) el.scrollBy({ left: 400, behavior: 'smooth' });")
                time.sleep(1.5)
        except Exception as e:
            print(f"[Scroll corridor fallback] {e}")

        # Activate Rotterdam Scenario
        print("[SCENE 3] Activating Rotterdam North Sea Severe Storm Scenario...")
        rotterdam_btn = page.locator('button:has-text("Activate Rotterdam Scenario")')
        if rotterdam_btn.count() > 0:
            rotterdam_btn.first.click()
            time.sleep(2.5)

        # Scroll to show live exposure engagement and Monte Carlo curve
        smooth_scroll(420, steps=6, delay=0.08)
        time.sleep(2)
        smooth_scroll(800, steps=6, delay=0.08)
        time.sleep(2)

        page.evaluate("window.scrollTo(0, 0)")
        time.sleep(1)

        # Demonstrate Real Multi-Portfolio Switcher
        print("[SCENE 3] Demonstrating Merchant Portfolio Switcher...")
        select_box = page.locator('.ant-select').first
        if select_box.count() > 0:
            select_box.click()
            time.sleep(1)
            ny_opt = page.locator('.ant-select-item-option-content:has-text("New York Logistics Co.")')
            if ny_opt.count() > 0:
                ny_opt.first.click()
                time.sleep(2)

            # Switch back to All Portfolios
            select_box.click()
            time.sleep(0.8)
            all_opt = page.locator('.ant-select-item-option-content:has-text("All Portfolios")')
            if all_opt.count() > 0:
                all_opt.first.click()
                time.sleep(1.5)

        # -----------------------------------------------------------
        # SCENE 4: AT-RISK EXPOSURE (AG Grid & Inspect Drawer)
        # -----------------------------------------------------------
        print("[SCENE 4] Navigating to At-Risk Exposure...")
        page.goto("http://127.0.0.1:8080/at-risk", wait_until="networkidle")
        time.sleep(2.5)
        smooth_scroll(280, steps=5, delay=0.08)
        time.sleep(2)

        # Click Inspect on first row
        inspect_btn = page.locator('button:has-text("Inspect")').first
        if inspect_btn.count() > 0:
            inspect_btn.click()
            time.sleep(2)
            page.keyboard.press("Escape")
            time.sleep(1)

        # -----------------------------------------------------------
        # SCENE 5: ACTION APPROVALS (Human-in-the-Loop Intercept Gate)
        # -----------------------------------------------------------
        print("[SCENE 5] Navigating to Action Approvals...")
        page.goto("http://127.0.0.1:8080/approvals", wait_until="networkidle")
        time.sleep(2.5)

        checkboxes = page.locator('input.ant-checkbox-input')
        if checkboxes.count() > 2:
            checkboxes.nth(1).check()
            time.sleep(0.8)
            checkboxes.nth(2).check()
            time.sleep(1)

        time.sleep(2)

        # -----------------------------------------------------------
        # SCENE 6: PAYPAL SELLER PROTECTION RAG & INGESTION ENGINE
        # -----------------------------------------------------------
        print("[SCENE 6] Navigating to Policy RAG & Ingestion Engine...")
        page.goto("http://127.0.0.1:8080/policy-rag", wait_until="networkidle")
        time.sleep(2.5)

        # Demonstrate Semantic Search
        quick_chip = page.locator('span.ant-tag:has-text("Seller Protection Section 11.2")')
        if quick_chip.count() > 0:
            quick_chip.first.click()
            time.sleep(2)

        smooth_scroll(300, steps=5, delay=0.08)
        time.sleep(2)

        # Show Guardrails AI Security Metrics Tab
        guard_tab = page.locator('div[role="tab"]:has-text("Guardrails AI Security Metrics")')
        if guard_tab.count() > 0:
            guard_tab.first.click()
            time.sleep(2)

        # -----------------------------------------------------------
        # SCENE 7: AI AGENT MONITORING (LangGraph Multi-Agent Trace)
        # -----------------------------------------------------------
        print("[SCENE 7] Navigating to AI Agent Monitoring...")
        page.goto("http://127.0.0.1:8080/langchain-monitor", wait_until="networkidle")
        time.sleep(2.5)

        smooth_scroll(250, steps=4, delay=0.08)
        time.sleep(2)

        # -----------------------------------------------------------
        # SCENE 8: DISPUTE SENTINEL & AUDIT LEDGER
        # -----------------------------------------------------------
        print("[SCENE 8] Navigating to Dispute Center...")
        page.goto("http://127.0.0.1:8080/disputes", wait_until="networkidle")
        time.sleep(2)

        print("[SCENE 8] Navigating to Audit Ledger...")
        page.goto("http://127.0.0.1:8080/audit", wait_until="networkidle")
        time.sleep(2)
        smooth_scroll(250, steps=4, delay=0.08)
        time.sleep(2)

        # -----------------------------------------------------------
        # SCENE 9: FINALE BACK TO DASHBOARD WITH REALTIME AGENT TICKER
        # -----------------------------------------------------------
        print("[SCENE 9] Returning to Dashboard for finale...")
        page.goto("http://127.0.0.1:8080/", wait_until="networkidle")
        time.sleep(2)
        page.evaluate("window.scrollTo(0, 0)")
        time.sleep(2.5)

        # Finalize and close context to flush video to disk
        print("[DEMO RECORDING] Finalizing video file...")
        context.close()
        browser.close()

    # Find the generated video file
    video_files = [f for f in os.listdir(OUTPUT_DIR) if f.endswith(".webm")]
    if video_files:
        latest_video = max([os.path.join(OUTPUT_DIR, f) for f in video_files], key=os.path.getmtime)
        target_path = os.path.join(OUTPUT_DIR, "Day0_Shield_Demo_Walkthrough.webm")
        if latest_video != target_path:
            if os.path.exists(target_path):
                try:
                    os.remove(target_path)
                except:
                    pass
            try:
                os.rename(latest_video, target_path)
            except:
                target_path = latest_video
        print(f"[DEMO RECORDING SUCCESS] Saved demo video to: {target_path}")
        size_mb = os.path.getsize(target_path) / (1024 * 1024)
        print(f"[DEMO RECORDING SUCCESS] File Size (WebM): {size_mb:.2f} MB")

        # Convert to MP4 using imageio_ffmpeg
        try:
            import subprocess
            import imageio_ffmpeg
            ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
            mp4_path = os.path.join(OUTPUT_DIR, "Day0_Shield_Demo_Walkthrough.mp4")
            cmd = [
                ffmpeg_exe, "-y", "-i", target_path,
                "-c:v", "libx264", "-preset", "fast", "-crf", "22", "-pix_fmt", "yuv420p",
                mp4_path
            ]
            subprocess.run(cmd, capture_output=True, check=True)
            mp4_mb = os.path.getsize(mp4_path) / (1024 * 1024)
            print(f"[DEMO RECORDING SUCCESS] Converted to MP4: {mp4_path} ({mp4_mb:.2f} MB)")
            return mp4_path
        except Exception as e:
            print(f"[MP4 CONVERT WARNING] Could not convert to MP4: {e}")
            return target_path
    else:
        print("[DEMO RECORDING ERROR] No video file found!")
        return None

if __name__ == "__main__":
    run_demo()
