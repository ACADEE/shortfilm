const GENRES = ['Romance', 'Revenge', 'Rebirth', 'Thriller', 'CEO', 'Fantasy', 'Drama', 'Mystery']
const TONES = ['Intense', 'Emotional', 'Dark', 'Comedic', 'Suspenseful']

function PillGroup({ label, options, value, onChange }) {
  return (
    <div>
      <p className="text-xs text-studio-muted uppercase tracking-widest mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              value === opt
                ? 'bg-duan-red border-duan-red text-white'
                : 'bg-transparent border-studio-border text-studio-muted hover:border-duan-red hover:text-white'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function GenreSelector({ genre, tone, onGenreChange, onToneChange }) {
  return (
    <div className="space-y-4">
      <PillGroup label="Genre" options={GENRES} value={genre} onChange={onGenreChange} />
      <PillGroup label="Tone" options={TONES} value={tone} onChange={onToneChange} />
    </div>
  )
}
