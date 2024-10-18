# Associate Management System

## 🚀 Overview

The Associate Management System is a powerful web application designed to streamline the process of managing associates, tracking incidents, and monitoring attendance. Built with modern web technologies, it offers a user-friendly interface for efficient workforce management.

Check out the `schema.prisma` file to get more information on how the data model works and how different entities are related.

## ✨ Features

🔍 **Smart Associate Search**: Quickly find associates with an intuitive search functionality.
📊 **Incident Tracking**: Log and manage incidents associated with employees.
🕒 **Attendance Management**: Keep track of attendance occurrences and points.
🖱️ **User-Friendly Interface**: Sleek, responsive design with keyboard navigation support.
📜 **Rule-Based Corrective Actions**: Manage and apply rules for corrective actions.
🎨 **Theme Selector**: Choose between different themes, including a dark mode option.
🖋️ **Improved Corrective Action Editing**: Enhanced functionality for editing Corrective Actions.
📊 **Optimized Excel Exports**: Improved Excel export functionality, now excluding file objects for better performance.

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
