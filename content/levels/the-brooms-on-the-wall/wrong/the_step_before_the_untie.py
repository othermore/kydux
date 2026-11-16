wizard.move_up(3)
wizard.move_left(3)
brooms = wizard.find_all("broom")
for broom in brooms:
    wizard.move_right()
    broom.untie()
