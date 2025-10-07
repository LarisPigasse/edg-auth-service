// src/modules/auth/models/associations.ts
export const setupAuthAssociations = (models: any[]) => {
  const Account = models.find(m => m.name === 'Account');
  const Session = models.find(m => m.name === 'Session');
  const ResetToken = models.find(m => m.name === 'ResetToken');

  if (Account && Session) {
    Account.hasMany(Session, { foreignKey: 'accountId', as: 'sessions' });
    Session.belongsTo(Account, { foreignKey: 'accountId', as: 'account' });
  }

  if (Account && ResetToken) {
    Account.hasMany(ResetToken, { foreignKey: 'accountId', as: 'resetTokens' });
    ResetToken.belongsTo(Account, { foreignKey: 'accountId', as: 'account' });
  }
};
