export function formatDuration(totalSeconds) {
  if (totalSeconds <= 0) {
    return "0s";
  }

  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  let result = "";
  if (days > 0) result += `${days}d `;
  if (hours > 0 || days > 0) result += `${hours}h `;
  if (minutes > 0 || hours > 0 || days > 0) result += `${minutes}m `;
  result += `${seconds}s`;

  return result.trim();
}

export function calculateRemainingTime(targetTimestamp) {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const remainingSeconds = targetTimestamp - nowSeconds;

    if (remainingSeconds <= 0) {
        return { seconds: 0, formatted: "Finished" };
    }

    return { seconds: remainingSeconds, formatted: formatDuration(remainingSeconds) };
} 