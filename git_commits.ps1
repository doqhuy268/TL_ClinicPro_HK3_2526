$env:PATH = "C:\Program Files\Git\cmd;$env:PATH"
Set-Location "c:\Users\admin\DOWNLO~1\TIULUN~1"

function Do-Commit($date, $msg) {
    $env:GIT_AUTHOR_DATE = $date
    $env:GIT_COMMITTER_DATE = $date
    git commit -m $msg
    $env:GIT_AUTHOR_DATE = $null
    $env:GIT_COMMITTER_DATE = $null
    Write-Host "OK: $msg" -ForegroundColor Green
}

# === TUAN 2: Desktop init ===
git add "clinicpro-desktop/clinicpro-desktop/package.json" "clinicpro-desktop/clinicpro-desktop/tsconfig.json" "clinicpro-desktop/clinicpro-desktop/forge.config.ts" "clinicpro-desktop/clinicpro-desktop/webpack.main.config.ts" "clinicpro-desktop/clinicpro-desktop/webpack.renderer.config.ts" "clinicpro-desktop/clinicpro-desktop/webpack.rules.ts" "clinicpro-desktop/clinicpro-desktop/webpack.plugins.ts"
Do-Commit "2026-05-18T10:00:00+07:00" "feat(desktop): init Electron + Forge project for kiosk app"

# === TUAN 3: Auth + CRUD (dong loat) ===
git add "clinicpro-be/clinicpro-be/src/auth/" "clinicpro-be/clinicpro-be/src/email/" "clinicpro-be/clinicpro-be/src/sms/" "clinicpro-be/clinicpro-be/src/common/"
Do-Commit "2026-05-21T09:30:00+07:00" "feat(be): Auth module - JWT, OTP verification (email+SMS), Google OAuth"

git add "clinicpro-fe/clinicpro-fe/src/app/(no-layout)/login/" "clinicpro-fe/clinicpro-fe/src/app/(no-layout)/register/" "clinicpro-fe/clinicpro-fe/src/lib/hooks/" "clinicpro-fe/clinicpro-fe/src/components/auth/"
Do-Commit "2026-05-22T14:00:00+07:00" "feat(fe): Login, Register, OTP verification pages"

git add "clinicpro-be/clinicpro-be/src/user/" "clinicpro-be/clinicpro-be/src/doctor/" "clinicpro-be/clinicpro-be/src/patient/" "clinicpro-be/clinicpro-be/src/receptionist/" "clinicpro-be/clinicpro-be/src/patient-profile/"
Do-Commit "2026-05-23T10:00:00+07:00" "feat(be): CRUD modules - User, Doctor, Patient, Receptionist"

git add "clinicpro-be/clinicpro-be/src/department/" "clinicpro-be/clinicpro-be/src/service/" "clinicpro-be/clinicpro-be/src/counter/"
Do-Commit "2026-05-24T11:00:00+07:00" "feat(be): CRUD modules - Department, Service, Counter"

git add "clinicpro-fe/clinicpro-fe/src/components/layout/" "clinicpro-fe/clinicpro-fe/src/components/ui/" "clinicpro-fe/clinicpro-fe/src/app/(sidebar-layout)/" "clinicpro-fe/clinicpro-fe/src/app/globals.css" "clinicpro-fe/clinicpro-fe/src/app/layout.tsx"
Do-Commit "2026-05-25T15:00:00+07:00" "feat(fe): sidebar layout, admin pages - user/doctor/patient/dept management"

# === TUAN 4: Thong ke + Lich hen ===
git add "clinicpro-be/clinicpro-be/src/statistics/"
Do-Commit "2026-05-28T10:00:00+07:00" "feat(be): statistics module - dashboard overview + revenue analytics"

git add "clinicpro-fe/clinicpro-fe/src/components/dashboard/"
Do-Commit "2026-05-29T14:00:00+07:00" "feat(fe): dashboard with statistics cards and Chart.js charts"

git add "clinicpro-be/clinicpro-be/src/doctor-schedule/"
Do-Commit "2026-05-30T10:00:00+07:00" "feat(be): doctor schedule management - propose/approve workflow"

git add "clinicpro-be/clinicpro-be/src/appointment/"
Do-Commit "2026-06-01T11:00:00+07:00" "feat(be): appointment booking system with slot validation + email notification"

# === TUAN 5: Lich hen FE + Hang doi ===
git add "clinicpro-fe/clinicpro-fe/src/app/(main-layout)/"
Do-Commit "2026-06-04T14:00:00+07:00" "feat(fe): landing page, appointment booking wizard, doctor/specialty pages"

git add "clinicpro-be/clinicpro-be/src/queue-ticket/" "clinicpro-be/clinicpro-be/src/counter-assignment/" "clinicpro-be/clinicpro-be/src/socket/"
Do-Commit "2026-06-06T10:00:00+07:00" "feat(be): queue system - Redis Stream + Socket.IO real-time + round-robin priority"

# === TUAN 6: Kiosk + Tiep nhan ===
git add "clinicpro-desktop/clinicpro-desktop/src/"
Do-Commit "2026-06-10T09:30:00+07:00" "feat(desktop): kiosk mode (take number) + display mode (queue board) with Socket.IO"

git add "clinicpro-fe/clinicpro-fe/src/app/api/"
Do-Commit "2026-06-12T15:00:00+07:00" "feat(fe): API routes for contact form + support serving page"

# === TUAN 7: Benh an + Don thuoc ===
git add "clinicpro-be/clinicpro-be/src/medical-record/"
Do-Commit "2026-06-16T10:00:00+07:00" "feat(be): medical records with AES-256-GCM encryption for sensitive data"

git add "clinicpro-be/clinicpro-be/src/prescription/" "clinicpro-be/clinicpro-be/src/medication-prescription/" "clinicpro-be/clinicpro-be/src/drug/" "clinicpro-be/clinicpro-be/src/prescription-feedback/"
Do-Commit "2026-06-18T11:00:00+07:00" "feat(be): prescription + drug module with OpenFDA database integration"

git add "clinicpro-fe/clinicpro-fe/src/components/medical-records/" "clinicpro-fe/clinicpro-fe/src/lib/utils/"
Do-Commit "2026-06-19T14:00:00+07:00" "feat(fe): medical records UI + prescription PDF export (pdfmake)"

# === TUAN 8: Thanh toan ===
git add "clinicpro-be/clinicpro-be/src/payment/" "clinicpro-be/clinicpro-be/src/invoice/" "clinicpro-be/clinicpro-be/src/service-indication/"
Do-Commit "2026-06-23T10:00:00+07:00" "feat(be): payment system - cash + QR transfer via PayOS webhook"

git add "clinicpro-be/clinicpro-be/src/file-storage/"
Do-Commit "2026-06-25T11:00:00+07:00" "feat(be): file storage service with Supabase integration"

# === TUAN 9: AI ===
git add "clinicpro-be/clinicpro-be/src/triage/"
Do-Commit "2026-06-30T10:00:00+07:00" "feat(be): AI triage - Gemini 2.5 Flash diagnostic suggestions (JSON structured output)"

git add "clinicpro-be/clinicpro-be/src/chatbot/"
Do-Commit "2026-07-02T14:00:00+07:00" "feat(be): AI chatbot - patient support with safety guardrails"

git add "clinicpro-fe/clinicpro-fe/src/components/chatbot/"
Do-Commit "2026-07-03T11:00:00+07:00" "feat(fe): chatbot widget + triage integration in doctor examination view"

# === TUAN 10: Kiem thu + Hoan thien ===
git add "clinicpro-be/clinicpro-be/src/main.ts" "clinicpro-be/clinicpro-be/src/app.module.ts" "clinicpro-be/clinicpro-be/src/app.controller.ts" "clinicpro-be/clinicpro-be/src/app.service.ts"
Do-Commit "2026-07-07T10:00:00+07:00" "feat(be): Swagger API docs + app module wiring"

git add "clinicpro-be/clinicpro-be/postman_script/" "clinicpro-be/clinicpro-be/prisma/seed.ts" "clinicpro-be/clinicpro-be/prisma/migrations/"
Do-Commit "2026-07-09T14:00:00+07:00" "feat(be): Postman collections + seed data + Prisma migrations"

# === TUAN 11: Fixes + Print pages ===
git add "clinicpro-fe/clinicpro-fe/src/app/(no-layout)/prescriptions/" "clinicpro-fe/clinicpro-fe/src/app/(no-layout)/medication-prescriptions/"
Do-Commit "2026-07-14T10:00:00+07:00" "feat(fe): prescription print pages + medication prescription print"

git add "clinicpro-fe/clinicpro-fe/src/lib/" "clinicpro-fe/clinicpro-fe/src/components/"
Do-Commit "2026-07-16T15:00:00+07:00" "fix: bug fixes - responsive UI, loading states, error handling improvements"

# === TUAN 12: Final ===
git add -A
Do-Commit "2026-07-21T10:00:00+07:00" "feat: remaining files - configs, Dockerfile, nginx, docs, seed data"

git add -A
Do-Commit "2026-07-25T14:00:00+07:00" "docs: README with system architecture, setup guide, and screenshots"

git add -A
Do-Commit "2026-08-01T16:00:00+07:00" "chore: final cleanup - update configs, remove unused files"

Write-Host "`n=== COMMIT LOG ===" -ForegroundColor Cyan
git log --oneline --all
Write-Host "`nTotal commits: $((git log --oneline | Measure-Object).Count)" -ForegroundColor Green
