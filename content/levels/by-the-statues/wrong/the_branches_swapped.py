wizard.move_down()
if dask.facing == "left":
    wizard.move_left()
    wizard.move_down(3)
    wizard.move_right()
else:
    wizard.move_right()
    wizard.move_down(3)
    wizard.move_left()
wizard.move_down(2)
