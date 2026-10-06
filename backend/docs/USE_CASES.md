# USE CASES & ARCHITECTURE DOCUMENTATION

## Primary Actors
1. **Public User**: Searches events, reserves seats, pays online, receives QR ticket.
2. **Admin / Manager**: Accesses enterprise dashboard, manages events, cities, halls, seat maps, and sessions.
3. **Super Admin**: Manages system users, roles, permissions, system settings, and audit logs.
4. **Finance Manager**: Oversees sales, school/organization group reservations, invoices, and settlements.
5. **Gate Operator**: Validates tickets at venue gates via QR code scanners.
6. **SMS Provider (Kavenegar)**: Delivers 4-digit OTP codes for authentication.

## Use Case Diagram (PlantUML Format)

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle

actor "Public User" as User
actor "Admin / Super Admin" as Admin
actor "Finance Manager" as Finance
actor "Gate Operator" as Gate
actor "Kavenegar SMS Service" as SMS

rectangle "Youth Event Platform System" {

    package "Authentication" {
        usecase "Request OTP (Mobile)" as UC_ReqOTP
        usecase "Verify OTP & Issue JWT" as UC_VerifyOTP
    }

    package "Public Ticketing" {
        usecase "Browse Events & Categories" as UC_Browse
        usecase "Select Session & Seats" as UC_SelectSeat
        usecase "Checkout & Payment" as UC_Checkout
        usecase "View Electronic Tickets" as UC_ViewTickets
    }

    package "Admin Panel & Governance" {
        usecase "View Dashboard Analytics" as UC_Dashboard
        usecase "Manage Events & Sessions" as UC_Events
        usecase "Manage Cities, Halls & Seat Maps" as UC_Halls
        usecase "Manage Group Reservations & Invoices" as UC_Invoices
        usecase "Manage Users, Roles & Permissions" as UC_Users
    }

    package "Operations & Verification" {
        usecase "Scan QR Code & Validate Gate Entry" as UC_Gate
    }
}

User --> UC_ReqOTP
User --> UC_VerifyOTP
User --> UC_Browse
User --> UC_SelectSeat
User --> UC_Checkout
User --> UC_ViewTickets

Admin --> UC_ReqOTP
Admin --> UC_VerifyOTP
Admin --> UC_Dashboard
Admin --> UC_Events
Admin --> UC_Halls
Admin --> UC_Users

Finance --> UC_Invoices

Gate --> UC_Gate

UC_ReqOTP ..> SMS : "Sends OTP via API / Dev 1111"
@enduml
```
