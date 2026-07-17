# Associate Management System

## 🚀 Overview

The Associate Management System is a complete web application designed to revolutionize workforce management through efficient tracking of incidents, attendance, and corrective actions. Built with modern web technologies and a focus on user experience, it provides a robust platform for HR professionals and managers to:

- **Streamline Incident Management**: Efficiently track and manage attendance-related incidents with automated point calculations and threshold monitoring.
- **Enhance Compliance**: Maintain detailed records of corrective actions and follow standardized procedures for incident handling.
- **Drive Data-Driven Decisions**: Generate comprehensive reports and analytics to identify patterns and make informed decisions.
- **Ensure Consistency**: Apply standardized rules and procedures across all associate interactions.

The system is built on a solid foundation using Prisma as the ORM with a well-structured data model (detailed in `schema.prisma`). It combines powerful backend capabilities with a responsive, user-friendly frontend to deliver a seamless management experience.

## ✨ Features

### 📊 Occurrence & Associate Management

![Occurrence List](public/occ-list.png)

Track and manage attendance-related incidents with our comprehensive occurrence system. The intuitive interface allows you to:

- Log and categorize attendance incidents
- Track points and thresholds
- Add detailed comments and documentation
- Filter and search through records

### 👥 Associate Records

![Associate List](public/assoc-list.png)

Maintain detailed associate information in a centralized system:

- Quick associate search and filtering
- Comprehensive profile management
- Historical record tracking
- Department and role organization

### 📈 Advanced Reporting

![Reports Interface](public/reports.png)

Generate detailed insights and analytics:

- Direct Excel template uploads through the admin panel
- Excel export functionality
- Trend analysis and visualizations
- Filtered data exports

Additional features include:

- 🖱️ **User-Friendly Interface**: Sleek, responsive design with keyboard navigation support
- 📜 **Rule-Based Corrective Actions**: Automated corrective action management
- 🎨 **Theme Selector**: Multiple theme options including dark mode
- 🔒 **Role-Based Access**: Secure, permission-based system access

## 🛠️ Technologies Used

- **Frontend:** React, TypeScript, and Vite
- **Styling:** Tailwind CSS and Shadcn UI
- **Backend:** Express
- **Database:** PostgreSQL or file-backed PGlite
- **ORM:** Prisma

## 📦 Quick Start

```bash
npm install
# Copy .env-example to .env and replace the placeholder secrets.
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

The default `.env-example` uses file-backed PGlite, so PostgreSQL does not need to be installed for local development. See the [Local Development Guide](docs/LOCAL_DEVELOPMENT.md) for database options and complete setup instructions.

## 📚 Documentation

- [Local development and database setup](docs/LOCAL_DEVELOPMENT.md)
- [Database seeding and flags](docs/SEEDING.md)
- [Authentication and admin setup](AUTHENTICATION.md)
- [Email setup](docs/EMAIL_SETUP.md)
- [Excel export setup](docs/EXCEL_EXPORTS.md)
- [Backup and restore](docs/BACKUP_RESTORE.md)

## 🖥️ Usage

After starting the development server, open the Vite URL shown in the console.

Use the associate search functionality to find and select associates. You can then view their details, log incidents, or manage their attendance records.

## 🤝 Contributing

We welcome contributions to the Associate Management System! Please feel free to submit issues, fork the repository and send pull requests!

## 📄 License

[MIT License](https://opensource.org/licenses/MIT)

## 🔮 Future Plans

- Implement data visualization for attendance trends
- Integrate with external HR systems

---

Built with ❤️ by Some Dude
