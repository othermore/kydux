wizard.move_down(2)
door.open()
wizard.move_down(2)
wizard.cast("osto")
wizard.move_down(3)
while dask.facing == "right":
    wizard.wait()
wizard.move_down(4)
