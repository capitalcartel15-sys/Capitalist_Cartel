// Commission calculation, ported from the original frontend logic
// (src/pages/Payments.tsx). Now authoritative on the server.
//
// Rules:
//   - received = amount * received_percentage% (default 90%)
//   - employee handler: employee gets employee_commission% (default 30%) of received;
//     the remaining is split between the (up to two) bosses, boss_split_percentage% each (default 50/50)
//   - boss handler: boss gets 100% of received
//
// `settings` is a map of setting_name -> numeric value.
// `profiles` is the list of all active profiles (to locate the bosses).
export function calculateCommission(amount, handler, profiles, settings) {
  const receivedPercentage = settings.received_percentage ?? 90;
  const employeeCommission = settings.employee_commission ?? 30;
  const bossSplitPercentage = settings.boss_split_percentage ?? 50;

  const receivedAmount = (amount * receivedPercentage) / 100;

  if (!handler) {
    return { receivedAmount, commissions: [] };
  }

  const commissions = [];

  if (handler.role === 'employee') {
    const employeeShare = (receivedAmount * employeeCommission) / 100;
    commissions.push({ userId: handler.id, amount: employeeShare, type: 'primary' });

    const remainingAmount = receivedAmount - employeeShare;
    const bossShare = (remainingAmount * bossSplitPercentage) / 100;

    const bosses = profiles.filter((p) => p.role === 'boss');
    if (bosses.length >= 1) {
      commissions.push({ userId: bosses[0].id, amount: bossShare, type: 'secondary' });
    }
    if (bosses.length >= 2) {
      commissions.push({ userId: bosses[1].id, amount: bossShare, type: 'secondary' });
    }
  } else if (handler.role === 'boss') {
    commissions.push({ userId: handler.id, amount: receivedAmount, type: 'primary' });
  }

  return { receivedAmount, commissions };
}
