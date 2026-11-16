fallen = wizard.find_all("broom")
wizard.move_up(3)
hung = wizard.find_all("broom")
wizard.say(len(fallen) + len(hung))
