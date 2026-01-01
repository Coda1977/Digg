import { EditorialInput, EditorialSelect } from "@/components/editorial";

type RatingConfig = {
  max: number;
  lowLabel?: string;
  highLabel?: string;
};

type RatingConfigPanelProps = {
  config: RatingConfig;
  onChange: (config: RatingConfig) => void;
};

export function RatingConfigPanel({ config, onChange }: RatingConfigPanelProps) {
  return (
    <div className="border-l-3 border-ink/20 pl-6 space-y-4 mt-4">
      <h4 className="font-sans text-[0.875rem] font-semibold text-ink uppercase tracking-wide">
        Rating Scale Configuration
      </h4>

      {/* Scale Range */}
      <div className="space-y-2">
        <label className="font-sans text-[0.875rem] font-medium text-ink">
          Scale Range <span className="text-accent-red">*</span>
        </label>
        <EditorialSelect
          value={config.max.toString()}
          onChange={(e) =>
            onChange({ ...config, max: parseInt(e.target.value) })
          }
        >
          <option value="3">1-3 (Low/Medium/High)</option>
          <option value="4">1-4</option>
          <option value="5">1-5 (Common)</option>
          <option value="7">1-7</option>
          <option value="10">1-10 (Detailed)</option>
        </EditorialSelect>
        <p className="font-sans text-[0.75rem] text-ink-soft">
          Respondents will see number buttons from 1 to {config.max}
        </p>
      </div>

      {/* Low Label */}
      <div className="space-y-2">
        <label className="font-sans text-[0.875rem] font-medium text-ink">
          Low End Label (Optional)
        </label>
        <EditorialInput
          type="text"
          value={config.lowLabel || ""}
          onChange={(e) =>
            onChange({ ...config, lowLabel: e.target.value || undefined })
          }
          placeholder="e.g., Poor, Disagree, Not at all"
        />
        <p className="font-sans text-[0.75rem] text-ink-soft">
          Displays below "1" on the rating scale
        </p>
      </div>

      {/* High Label */}
      <div className="space-y-2">
        <label className="font-sans text-[0.875rem] font-medium text-ink">
          High End Label (Optional)
        </label>
        <EditorialInput
          type="text"
          value={config.highLabel || ""}
          onChange={(e) =>
            onChange({ ...config, highLabel: e.target.value || undefined })
          }
          placeholder="e.g., Excellent, Agree, Extremely well"
        />
        <p className="font-sans text-[0.75rem] text-ink-soft">
          Displays below "{config.max}" on the rating scale
        </p>
      </div>

      {/* AI Follow-up Info */}
      <div className="bg-ink/5 px-4 py-3 space-y-2">
        <p className="font-sans text-[0.75rem] font-medium text-ink">
          AI Follow-up Behavior
        </p>
        <p className="font-sans text-[0.75rem] text-ink-soft leading-relaxed">
          The AI will automatically ask adaptive follow-up questions based on the rating
          given (e.g., "What would it take to move from a 6 to an 8?").
        </p>
      </div>
    </div>
  );
}
