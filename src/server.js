import dotenv from "dotenv";
import { ensureDatabaseReady } from "./dbBootstrap.js";

dotenv.config();

await ensureDatabaseReady();

const { createApp } = await import("./app.js");

const app = createApp();
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
