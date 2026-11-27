wizard.move_up(3)
wizard.move_right(4)
brooms = wizard.find_all("broom")
for each_broom in brooms:
    each_broom.untie()
    wizard.move_left()
