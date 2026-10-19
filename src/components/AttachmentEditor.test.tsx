import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AttachmentEditor } from './AttachmentEditor';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AttachmentEditor', () => {
  it('adds an audio URL as playable audio metadata, not as a generic external link', () => {
    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => '11111111-1111-4111-8111-111111111111') });
    const onChange = vi.fn();

    render(
      <AttachmentEditor
        attachments={[]}
        onChange={onChange}
        onAddFile={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByRole('combobox', { name: 'Attachment format' }), {
      target: { value: 'audio' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Attachment source' }), {
      target: { value: 'url' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'New attachment label' }), {
      target: { value: 'Release notes audio' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'New attachment URL' }), {
      target: { value: 'https://cdn.example.test/release.ogg' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add audio URL' }));

    expect(onChange).toHaveBeenCalledWith([
      {
        id: '11111111-1111-4111-8111-111111111111',
        kind: 'audio',
        label: 'Release notes audio',
        url: 'https://cdn.example.test/release.ogg',
        mimeType: 'audio/mpeg',
      },
    ]);
  });

  it('rejects unsupported uploads and adds valid files through the pending-asset callback', () => {
    vi.stubGlobal('crypto', {
      randomUUID: vi
        .fn()
        .mockReturnValueOnce('11111111-1111-4111-8111-111111111111')
        .mockReturnValueOnce('22222222-2222-4222-8222-222222222222'),
    });
    const onChange = vi.fn();
    const onAddFile = vi.fn();
    render(
      <AttachmentEditor
        attachments={[]}
        onChange={onChange}
        onAddFile={onAddFile}
        onRemove={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Upload image file'), {
      target: { files: [new File(['bad'], 'bad.gif', { type: 'image/gif' })] },
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a supported image file');
    expect(onAddFile).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Upload image file'), {
      target: { files: [new File(['png'], 'cover.png', { type: 'image/png' })] },
    });
    expect(onAddFile).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '11111111-1111-4111-8111-111111111111',
        assetId: '22222222-2222-4222-8222-222222222222',
        kind: 'image',
        mimeType: 'image/png',
        sizeBytes: 3,
      }),
      expect.any(File),
    );
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ kind: 'image', label: 'cover.png' }),
    ]);
  });
});
