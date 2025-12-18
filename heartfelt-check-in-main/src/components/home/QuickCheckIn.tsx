interface QuickCheckInProps {
  onCheckIn: () => void;
}

const QuickCheckIn = ({ onCheckIn }: QuickCheckInProps) => {
  return (
    <button
      onClick={onCheckIn}
      className="w-full py-4 rounded-2xl bg-accent/10 border border-accent/30 text-accent font-medium hover:bg-accent/15 hover:border-accent/40 transition-all"
    >
      New check-in
    </button>
  );
};

export default QuickCheckIn;
