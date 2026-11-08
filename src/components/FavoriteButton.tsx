export function FavoriteButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      className={`fav-btn ${active ? 'active' : ''}`}
      aria-pressed={active}
      aria-label={active ? `${label}をお気に入りから外す` : `${label}をお気に入りに追加`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {active ? '★' : '☆'}
    </button>
  );
}
