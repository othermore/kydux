wizard.move_up(2)
wizard.move_left(3)
brooms = wizard.find_all("broom")
for broom in brooms:
    broom.untie()
    wizard.move_right()
