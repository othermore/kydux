if left_door.locked:
    wizard.move_down(3)
    wizard.move_left(3)
    left_door.open()
    wizard.move_down(3)
    wizard.move_right(9)
else:
    wizard.move_down(3)
    wizard.move_right(3)
    right_door.open()
    wizard.move_down(3)
    wizard.move_right(3)
