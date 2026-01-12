export default function Avatar({ username }) {
  const getColor = (name) => {
    const colors = [
      "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500", 
      "bg-lime-500", "bg-green-500", "bg-emerald-500", "bg-teal-500", 
      "bg-cyan-500", "bg-sky-500", "bg-blue-500", "bg-indigo-500", 
      "bg-violet-500", "bg-purple-500", "bg-fuchsia-500", "bg-pink-500", "bg-rose-500"
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const initial = username ? username.charAt(0).toUpperCase() : "?";
  const colorClass = getColor(username || "");

  return (
    <div className={`w-10 h-10 min-w-[2.5rem] rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md ${colorClass}`}>
      {initial}
    </div>
  );
}