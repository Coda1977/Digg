type QuestionTypeSelectorProps = {
  value: "text" | "rating";
  onChange: (type: "text" | "rating") => void;
  disabled?: boolean;
};

export function QuestionTypeSelector({
  value,
  onChange,
  disabled = false,
}: QuestionTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="font-sans text-[0.875rem] font-medium text-ink">
        Question Type
      </label>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="questionType"
            value="text"
            checked={value === "text"}
            onChange={() => onChange("text")}
            disabled={disabled}
            className="w-4 h-4 text-accent-red focus:ring-accent-red focus:ring-2"
          />
          <span className="font-sans text-[0.875rem] text-ink">
            Text response
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="questionType"
            value="rating"
            checked={value === "rating"}
            onChange={() => onChange("rating")}
            disabled={disabled}
            className="w-4 h-4 text-accent-red focus:ring-accent-red focus:ring-2"
          />
          <span className="font-sans text-[0.875rem] text-ink">
            Rating scale
          </span>
        </label>
      </div>
    </div>
  );
}
