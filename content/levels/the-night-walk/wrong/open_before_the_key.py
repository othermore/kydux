wizard.move_down(3)
door.open()
wizard.move_down(2)
while not slab.in_place:
    wizard.wait()
wizard.move_down(3)
while dask.facing == "right":
    wizard.wait()
wizard.move_down(4)
