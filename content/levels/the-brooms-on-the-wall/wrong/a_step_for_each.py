wizard.move_up(3)
wizard.move_right(4)
brooms = wizard.find_all("broom")
for broom in brooms:
    broom.untie()
    wizard.move_left()
