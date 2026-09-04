#!/usr/bin/env python3
"""Add the openPrintWindow import to TimetableView.tsx"""
import os

f = r'C:\Users\harsh\OneDrive\Desktop\compl sdms\sdms-main\frontend\src\components\Client\TimetableView.tsx'
with open(f, 'r', encoding='utf-8') as fh:
    content = fh.read()

old = 'import { safeErrorMessage } from "../../utils/safeError";'
new = 'import { safeErrorMessage } from "../../utils/safeError";\nimport { openPrintWindow } from "../../utils/printWindow";'

if old not in content:
    print('ERROR: old string not found')
elif 'openPrintWindow' in content:
    print('Already added')
else:
    content = content.replace(old, new, 1)
    with open(f, 'w', encoding='utf-8') as fh:
        fh.write(content)
    print('Done')
