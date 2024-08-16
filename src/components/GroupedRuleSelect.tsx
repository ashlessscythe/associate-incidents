import React, { useRef, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Rule } from "@/lib/api";

interface GroupedRuleSelectProps {
  rules: Rule[];
  ruleId: string;
  setRuleId: (value: string) => void;
}

const GroupedRuleSelect: React.FC<GroupedRuleSelectProps> = ({
  rules,
  ruleId,
  setRuleId,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const groupRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const groupedRules = rules.reduce((acc, rule) => {
    const group =
      rule.type === "SAFETY" ? "Appendix A - SAFETY" : "Appendix B - WORK";
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(rule);
    return acc;
  }, {} as Record<string, Rule[]>);

  const getItemLabel = (rule: Rule, index: number) => {
    if (rule.type === "SAFETY") {
      return `${index + 1}. ${rule.description}`;
    } else {
      return `${String.fromCharCode(65 + index)}. ${rule.description}`;
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const groups = Object.keys(groupedRules);
        for (let i = 0; i < groups.length - 1; i++) {
          const currentGroup = groupRefs.current[groups[i]];
          const nextGroup = groupRefs.current[groups[i + 1]];

          if (currentGroup && nextGroup) {
            const currentBottom = currentGroup.getBoundingClientRect().bottom;
            const nextTop = nextGroup.getBoundingClientRect().top;

            if (currentBottom <= nextTop && nextTop < window.innerHeight) {
              nextGroup.scrollIntoView({ behavior: "smooth", block: "start" });
              break;
            }
          }
        }
      }
    };

    const content = contentRef.current;
    if (content) {
      content.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (content) {
        content.removeEventListener("scroll", handleScroll);
      }
    };
  }, [groupedRules]);

  return (
    <Select onValueChange={setRuleId} value={ruleId}>
      <SelectTrigger>
        <SelectValue placeholder="Select a rule" />
      </SelectTrigger>
      <SelectContent>
        <div ref={contentRef} className="max-h-[300px] overflow-y-auto">
          {Object.entries(groupedRules).map(([group, groupRules]) => (
            <div
              key={group}
              ref={(el) => (groupRefs.current[group] = el)}
              className="mb-2"
            >
              <div className="py-2 px-2 font-semibold bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
                {group}
              </div>
              <div>
                {groupRules.map((rule, index) => (
                  <SelectItem key={rule.id} value={rule.id} className="pl-4">
                    {getItemLabel(rule, index)}
                  </SelectItem>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SelectContent>
    </Select>
  );
};

export default GroupedRuleSelect;
