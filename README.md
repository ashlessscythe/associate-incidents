# Associate Management System

## 🚀 Overview

The Associate Management System is a powerful web application designed to streamline the process of managing associates, tracking incidents, and monitoring attendance. Built with modern web technologies, it offers a user-friendly interface for efficient workforce management.

Check out the `schema.prisma` file to get more information on how the data model works and how different entities are related.

## ✨ Features

- 🔍 **Smart Associate Search**: Quickly find associates with an intuitive search functionality.
- 📊 **Incident Tracking**: Log and manage incidents associated with employees.
- 🕒 **Attendance Management**: Keep track of attendance occurrences and points.
- 🖱️ **User-Friendly Interface**: Sleek, responsive design with keyboard navigation support.
- 📜 **Rule-Based Corrective Actions**: Manage and apply rules for corrective actions.

## 🛠️ Technologies Used

- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Database**: PostgreSQL
- **ORM**: Prisma
- **API**: (Assuming RESTful API based on the structure, but not explicitly shown)

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

- `definitions-sample.js`: Contains sample rules and occurrence types.
- `associates-sample.csv`: Contains sample associate data.

To populate your database with this initial data:

1. Copy the sample files as mentioned in the installation steps.
2. Run the seeding script: `node seed.mjs`

This will populate your database with the sample associates, rules, and occurrence types, giving you a starting point to work with the system.

## 🖥️ Usage

After starting the development server, open your browser and navigate to `http://localhost:3000` (or the port specified in your console output).

Use the associate search functionality to find and select associates. You can then view their details, log incidents, or manage their attendance records.

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
