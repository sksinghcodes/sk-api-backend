import { describe, expect, it, vi } from 'vitest';
import { checkUnique } from '../../controllers/user';

describe('checkUnique', () => {
  it('should reject an invalid field', async () => {
    const req = {
      query: {}
    };

    const res = {
      json: vi.fn()
    };

    await checkUnique(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid field'
    });
  });
});
