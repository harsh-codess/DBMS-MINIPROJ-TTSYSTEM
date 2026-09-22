# PanelGrid

PanelGrid is a production-ready, automated university timetable scheduling system. It manages the complex constraints of academic scheduling, ensuring conflict-free timetables for faculty, students, and physical classroom infrastructure. The system is built with a robust database architecture and provides high-quality, printable reports suitable for formal distribution.

## Architecture and Design

The system relies on a strictly normalized relational database to maintain data integrity and an anti-clash engine enforced at the database level.

![ER Diagram](docs/er-diagram.jpg)

### Database Constraints (Anti-Clash Engine)
The scheduling engine prevents conflicts through hard database constraints rather than application-level logic:
- **Faculty Availability**: Teachers cannot be double-booked across different panels or subjects in the same period.
- **Room Occupancy**: A physical room cannot host multiple classes simultaneously.
- **Panel Integrity**: A student panel cannot attend two different theory lectures at the same time.
- **Lab Batch Integrity**: Individual lab batches are prevented from overlapping practical sessions.

### Relational Schema
The database operates in Third Normal Form (3NF) utilizing PostgreSQL (Neon). It features 10 core tables for entities such as `faculty`, `room`, `subject`, `panel`, and `teaching_assignment`. The final generated timetable is stored in `timetable_entry`, acting as the central nexus that links physical resources with temporal periods.

## Printable Reports

PanelGrid generates highly formatted, Excel-style reports designed specifically for A4 printing. These reports maintain rigid grid layouts, bypassing browser printing inconsistencies to ensure professional output.

![Timetable Report Demo](docs/ttdemo.jpg)

### Available Reports
1. **Panel Timetable**: A student-facing view combining theory lectures and split lab batches across the week.
2. **Faculty Timetable**: A teacher-facing view mapping individual schedules against their assigned duty windows.
3. **Room Occupancy**: An infrastructure view detailing period-by-period utilization of classrooms and laboratories.
4. **Workload Analysis**: A comparative report matching assigned academic hours against actually scheduled hours to identify unplaced gaps.

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL (hosted on Neon)
- **Styling**: Tailwind CSS
- **Authentication**: Custom authentication wrappers

## Setup and Installation

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database (or Neon connection string)

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/harsh-codess/DBMS-MINIPROJ-TTSYSTEM.git
cd DBMS-MINIPROJ-TTSYSTEM
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env.local` file in the root directory and add your database connection string:
```env
DATABASE_URL="postgres://user:password@host:port/database"
```

4. Initialize the database:
Run the provided schema and seed files against your PostgreSQL instance:
```bash
# Execute db/schema.sql followed by db/seed.sql
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Documentation and Viva Artifacts

The `docs/` directory contains all necessary artifacts for academic submission and review:
- `docs/er.md`: Comprehensive schema breakdown, normalization analysis, and index structures.
- `docs/sample-queries.sql`: A collection of 12 analytical SQL queries demonstrating system capabilities, including clash detection and utilization rates.
- `docs/viva-pack.md`: The master submission document detailing the project's technical specifications.

## License

This project is submitted as a DBMS Mini-Project. All rights reserved.
