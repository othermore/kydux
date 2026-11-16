wizard.move_up(3)
wizard.move_left(3)
brooms = wizard.find_all("broom")
for i in range(len(brooms)):
    brooms[i].untie()
    wizard.move_right()
