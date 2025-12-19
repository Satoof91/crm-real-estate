import { useState } from 'react';
import { AddContactDialog } from '../AddContactDialog';
import { Button } from '@/components/ui/button';

export default function AddContactDialogExample() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      <AddContactDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={(data) => console.log('Submitted:', data)}
      />
    </div>
  );
}
