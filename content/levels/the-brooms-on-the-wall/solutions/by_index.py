wizard.move_up(3)
wizard.move_right(4)
brooms = wizard.find_all("broom")
for i in range(len(brooms)):
    steps = brooms[i].distance_to(wizard)
    wizard.move_left(steps)
    brooms[i].untie()
