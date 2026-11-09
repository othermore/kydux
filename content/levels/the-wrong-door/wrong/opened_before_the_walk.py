if left_door.locked:
    right_door.open()
    wizard.move_down(2)
    wizard.move_right(3)
    wizard.move_down(3)
    wizard.move_right(3)
else:
    left_door.open()
    wizard.move_down(2)
    wizard.move_left(3)
    wizard.move_down(3)
    wizard.move_right(9)
