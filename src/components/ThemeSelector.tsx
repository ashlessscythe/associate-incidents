import { useTheme } from "next-themes";
import React, { useEffect, useState } from "react";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select";

const themes = [
  { name: "System", value: "system" },
  { name: "Day", value: "day" },
  { name: "Night", value: "night" },
  { name: "Corporate", value: "corporate" },
  { name: "Ocean", value: "ocean" },
  { name: "Nature", value: "nature" },
  { name: "Volcano", value: "volcano" },
  { name: "Sky", value: "sky" },
];

const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <Select
        value={theme}
        onValueChange={(value) => {
          setTheme(value);
          // Force a re-render
          setMounted(false);
          setTimeout(() => setMounted(true), 0);
        }}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Select theme" />
        </SelectTrigger>
        <SelectContent>
          {themes.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ThemeSelector;
