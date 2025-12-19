import { useState } from 'react';
import { AddBuildingDialog } from '../AddBuildingDialog';
import { Button } from '@/components/ui/button';

export default function AddBuildingDialogExample() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      <AddBuildingDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={(data) => console.log('Submitted:', data)}
      />
    </div>
  );
}
