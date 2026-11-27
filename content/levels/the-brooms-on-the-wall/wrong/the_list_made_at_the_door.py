brooms = wizard.find_all("broom")
wizard.move_up(3)
wizard.move_right(4)
for each_broom in brooms:
    steps = each_broom.distance_to(wizard)
    wizard.move_left(steps)
    each_broom.untie()
