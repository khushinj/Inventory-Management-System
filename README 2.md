# Consolidated Project Overview

This file replaces the scattered markdown notes across the repository. It gives a single overview of the frontend, backend, deployment, testing, and the feature-specific fixes that were documented elsewhere.

## Frontend Overview

The frontend is a Next.js app under `frontend/` with route-based screens for the major inventory flows: domestic, export, online, shop, and supporting dashboards. It uses a shared API layer, form-driven data entry, and route-specific layouts.

Frontend work documented in the old markdown files focused on:

- form behavior and validation for transaction entry
- Enter-key navigation between inputs
- route layout cleanup to avoid hydration issues
- API base URL wiring to the backend
- dashboard load reduction by limiting rendered rows
- shop inventory UI for grouped stock, filters, and stock visibility
- conditional fields and color dropdown behavior
- spacing and layout polish
- performance guidance for heavy data views

## Backend Overview

The backend is an Express/MongoDB service under `backend/` that handles warehouse transactions, shop inventory calculation, daily reports, normalization, and operational health checks.

Backend work documented in the old markdown files focused on:

- CRUD endpoints for warehouse, shop, online, export, and domestic flows
- daily report APIs with create, read, range, month, summary, and delete support
- stock return handling and inventory deduction logic
- design-number normalization and duplicate-entry cleanup
- automatic shop inventory recalculation from import, return, and sales data
- a lightweight health endpoint for keep-alive checks
- deployment notes and Render/Vercel guidance
- backend verification scripts and troubleshooting

## Feature Areas Covered By The Old Docs

### Inventory And Warehouse Flows

- stock creation, edit, delete, and verification
- warehouse domestic synchronization
- differential inventory APIs
- duplicate entry fixes and data normalization
- shop inventory edit and testing guidance

### Stock Return And Shop Inventory

- stock return deduction rules
- before/after comparisons for return logic
- technical verification of stock-return math
- grouped inventory calculation and display rules
- color, size, and design-number filtering

### Daily Reports

- backend implementation summary
- API documentation
- data structure and layered architecture
- reporting endpoints and validation rules

### Frontend Performance And UX

- dashboard performance tuning
- frontend load optimization
- conditional field behavior
- spacing fixes and UI cleanup
- dropdown and form experience improvements

### Operational Notes

- deployment instructions
- backend keep-alive guidance
- test and verification checklists
- quick start and reference material
- system status and applied-fixes summaries

## Consolidated Index Of Removed Markdown Files

### Getting Started And Navigation

- `START_HERE.md` - quick start entry point for running the system
- `QUICK_START.md` - extended startup and troubleshooting guide
- `REFERENCE_CARD.md` - short command and status reference
- `INDEX.md` - documentation map for the repo

### Global Summaries And Fix Logs

- `README_FIXES.md` - overview of applied fixes and validation
- `COMPLETE_SUMMARY.md` - large end-to-end issue resolution summary
- `FIXES_APPLIED.md` - technical breakdown of what changed
- `SYSTEM_STATUS.md` - current system health and checklist
- `CHANGES_LOG.md` - change history notes
- `FINAL_ALL_POSITIVE_SOLUTION.md` - final state summary
- `OPTIMIZATION_COMPLETED.md` - optimization completion notes
- `SPACING_FIX_SUMMARY.md` - spacing and UI cleanup recap
- `DATA_EXTRACTION_COMPLETE.md` - data extraction completion notes

### Frontend-Focused Docs

- `frontend/README.md` - default Next.js frontend readme
- `FRONTEND_LOAD_OPTIMIZATION.md` - limiting rendered rows for performance
- `DASHBOARD_PERFORMANCE_GUIDE.md` - dashboard speed and rendering guidance
- `CONDITIONAL_FIELDS_GUIDE.md` - conditional form field behavior
- `COLOR_DROPDOWN_FEATURE.md` - color selection feature notes
- `SHOP_INVENTORY_GUIDE.md` - shop inventory UI and API overview
- `SHOP_INVENTORY_TESTING.md` - testing steps for shop inventory
- `SHOP_INVENTORY_EDIT_FEATURE.md` - edit flow for shop inventory

### Backend-Focused Docs

- `BACKEND_KEEP_ALIVE_GUIDE.md` - health ping and uptime guidance
- `DEPLOYMENT.md` - Vercel and deployment notes
- `DIFFERENTIAL_INVENTORY_API.md` - inventory API notes
- `NORMALIZATION_DEVELOPER_GUIDE.md` - design-number and data normalization rules
- `DUPLICATE_ENTRIES_FIX.md` - duplicate cleanup fix notes
- `DESIGN_NUMBER_NORMALIZATION_FIX.md` - normalization fix explanation
- `SHOP_DOMESTIC_SYNC.md` - sync behavior between shop and domestic flows
- `DAILY_REPORT_IMPLEMENTATION.md` - backend daily report implementation
- `backend/DAILY_REPORT_API.md` - daily report endpoint documentation
- `backend/DAILY_REPORT_STRUCTURE.md` - daily report architecture guide

### Stock Return Docs

- `STOCK_RETURN_COMPLETE_SOLUTION.md` - full stock return solution summary
- `STOCK_RETURN_FIX_SUMMARY.md` - stock return bug fix recap
- `STOCK_RETURN_QUICK_GUIDE.md` - quick verification guide
- `STOCK_RETURN_BEFORE_AFTER.md` - before/after comparison
- `STOCK_RETURN_TECHNICAL_VERIFICATION.md` - mathematical verification
- `CUSTOMER_VS_STOCK_RETURN_FIX.md` - customer return versus stock return behavior

### Testing And Verification

- `TEST_GUIDE.md` - general test and verification instructions
- `verify_system.sh` - system verification script reference
- `verify_stock_return.sh` - stock return verification script reference
- `test_performance.sh` - performance testing script reference
- `test_stock_return_to_domestic.js` - stock return to domestic test reference
- `test-po-dispatch.js` - PO dispatch test reference

## Current Source Of Truth

- Keep `README.md` as the main top-level project readme.
- Use this file as the consolidated notes and documentation overview.
- The other markdown files were collapsed into this summary so the repository stays focused and easier to navigate.
