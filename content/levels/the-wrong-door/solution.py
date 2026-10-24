if left_door.locked:
    wizard.move_right(2)
    right_door.open()
    wizard.move_down(2)
    wizard.move_right(2)
else:
    wizard.move_left(2)
    left_door.open()
    wizard.move_down(2)
    wizard.move_right(6)
