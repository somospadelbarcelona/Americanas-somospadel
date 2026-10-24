# -*- coding: utf-8 -*-
try:
    import win32com.client
    outlook = win32com.client.Dispatch("Outlook.Application").GetNamespace("MAPI")
    inbox = outlook.GetDefaultFolder(6) # 6 = olFolderInbox
    print("Inbox name:", inbox.Name)
    messages = inbox.Items
    messages.Sort("[ReceivedTime]", True)
    print("Total messages in inbox:", messages.Count)
    found = 0
    for i in range(1, min(100, messages.Count + 1)):
        msg = messages.Item(i)
        subj = getattr(msg, "Subject", "")
        sender = getattr(msg, "SenderEmailAddress", "")
        if "playtomic" in subj.lower() or "playtomic" in sender.lower() or "americana" in subj.lower() or "halloween" in subj.lower():
            print(f"🔥 Email: {subj} | From: {sender} | Date: {msg.ReceivedTime}")
            body = getattr(msg, "Body", "")
            print("  Body excerpt:", body[:300])
            with open(f"scraper/email_playtomic_{found}.txt", "w", encoding="utf-8") as ef:
                ef.write(f"Subject: {subj}\nSender: {sender}\n\n{body}")
            found += 1
            if found >= 5: break
    print(f"Found {found} related emails.")
except Exception as e:
    print("Outlook COM err:", e)
