var script = 'tell application "Google Chrome"\n\
                    set windowList to every window\n\
                    repeat with aWindow in windowList\n\
                        set tabList to every tab of aWindow\n\
                        repeat with atab in tabList\n\
                            if (URL of atab contains "flex") then\n\
                                tell atab\n\
                                    execute javascript "window.location.reload()"\n\
                                end tell\n\
                            end if\n\
                        end repeat\n\
                    end repeat\n\
                end tell';