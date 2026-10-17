import { fileSlug, isoDay, saveBlob } from './download';

describe('download helpers', () => {
  it('makes a readable, safe file name', () => {
    expect(fileSlug(' 6ème A / Lycée ')).toBe('6ème-A-Lycée');
    expect(fileSlug('--x--')).toBe('x');
  });

  it('gives the local day, not the UTC one', () => {
    expect(isoDay(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });

  it('saves a blob through a temporary link', () => {
    spyOn(URL, 'createObjectURL').and.returnValue('blob:x');
    const click = spyOn(HTMLAnchorElement.prototype, 'click');
    saveBlob(new Blob(['x']), 'export.xlsx');
    expect(click).toHaveBeenCalled();
    expect(document.querySelector('a[download="export.xlsx"]')).toBeNull();
  });
});
