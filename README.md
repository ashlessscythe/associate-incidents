# Associate Management System

## 🚀 Overview

The Associate Management System is a comprehensive web application designed to revolutionize workforce management through efficient tracking of incidents, attendance, and corrective actions. Built with modern web technologies and a focus on user experience, it provides a robust platform for HR professionals and managers to:

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

- Customizable report templates
- Excel export functionality
- Trend analysis and visualizations
- Filtered data exports

Additional features include:

- 🖱️ **User-Friendly Interface**: Sleek, responsive design with keyboard navigation support
- 📜 **Rule-Based Corrective Actions**: Automated corrective action management
- 🎨 **Theme Selector**: Multiple theme options including dark mode
- 🔒 **Role-Based Access**: Secure, permission-based system access

## 🛠️ Technologies Used

**Frontend**: React with TypeScript
**Styling**: Tailwind CSS
**UI Components**: Shadcn UI
**Database**: PostgreSQL
**ORM**: Prisma
**API**: (Assuming RESTful API based on the structure, but not explicitly shown)

## 📦 Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/associate-management-system.git
   ```
2. Navigate to the project directory:
   ```
   cd associate-management-system
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Set up your PostgreSQL database and update the `DATABASE_URL` in your `.env` file.
5. Run Prisma migrations:
   ```
   npx prisma migrate dev
   ```
6. Copy sample files:
   ```
   cp definitions-sample.js definitions.js
   cp associates-sample.csv associates.csv
   ```
7. Seed the database with initial data:
   ```
   node seed.mjs
   ```
8. Start the development server:
   ```
   npm run dev
   ```

## 🌱 Seeding the Database

The project includes sample data files:

- `definitions-sample.js`: Contains sample notification levels, rules, and occurrence types.
- `associates-sample.csv`: Contains sample associate data.

To populate your database with this initial data:

1. Copy the sample files as mentioned in the installation steps:

   ```
   cp definitions-sample.js definitions.js
   cp associates-sample.csv associates.csv
   ```

2. (Optional) Modify `definitions.js` to customize notification levels, rules, and occurrence types:

   ```javascript
   // Sample content in definitions.js
   export const notificationLevels = [
     {
       designation: Designation.BRUH,
       level: 1,
       name: "Verbal Disciplinary Notice",
       pointThreshold: 4,
     },
     {
       designation: Designation.SECRETARY,
       level: 1,
       name: "Initial Secretary Notification",
       pointThreshold: 6,
     },
   ];

   export const rules = [
     {
       code: "Code A-C3",
       description: "Code description for A-C3",
       type: "OPERATIONS",
     },
     {
       code: "Code B-EEI",
       description: "Description for Rule B-EEI",
       type: "SIGNAL",
     },
   ];

   // ... other definitions
   ```

### 📂 Occurrences Data

In addition to `associates.csv` and `definitions.js`, the system also supports populating attendance occurrences via an `occurrences-sample.csv` file. This file contains sample data that tracks attendance occurrences for associates, including the date of the occurrence, the type (code), and any additional comments.

#### Sample `occurrences-sample.csv` Format:

```csv
SSO,name,date,code,comment
332333244,Bob Jones,2024-01-01,c02,Some Reason for the c02
```

3. Run the seeding script:

```
node seed.mjs
```

This will populate your database with the sample associates, notification levels, rules, and occurrence types, giving you a starting point to work with the system.

## 📊 Excel Exports

The system now supports exporting data to Excel files using customizable templates. These templates are stored using UploadThing, a file hosting service.
Setting Up Excel Templates

Create your Excel templates for occurrences and corrective actions.
Upload these templates to UploadThing.
Add the file keys to your .env file:

```
CA_TEMPLATE_KEY=your_ca_template_file_key
OCC_TEMPLATE_KEY=your_occurrence_template_file_key
```

The system will automatically fetch these templates when generating Excel reports, ensuring that you're always using the latest version of your templates without needing to update the application code.

## 🖥️ Usage

After starting the development server, open your browser and navigate to `http://localhost:3000` (or the port specified in your console output).

Use the associate search functionality to find and select associates. You can then view their details, log incidents, or manage their attendance records.

### 🎨 Theme Selection

The application now features a theme selector, allowing users to choose between different visual themes, including a dark mode option. This enhances user experience by providing personalized visual preferences.

## 🤝 Contributing

We welcome contributions to the Associate Management System! Please feel free to submit issues, fork the repository and send pull requests!

## 📄 License

[MIT License](https://opensource.org/licenses/MIT)

## 🔮 Future Plans

- Implement data visualization for attendance trends
- Add role-based access control
- Integrate with external HR systems

---

Built with ❤️ by Some Dude
