// Shared toJSON config for all models: expose `id` instead of `_id`,
// drop Mongoose internals and never leak the password hash.
export const baseToJSON = {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    ret.id = ret._id?.toString();
    delete ret._id;
    delete ret.password_hash;
    return ret;
  },
};
