wizard.move_up(2)
wizard.move_left(3)
brooms = wizard.find_all("broom")
for broom in brooms:
    wizard.move_right()
    broom.untie()
