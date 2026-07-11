//-----------------------------------------------------------------------
// <copyright file="Program.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2014 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.Design;
    using System.Linq;
    using System.Windows.Forms;

    using TechnologySolutions.ModelViewViewModel;

    /// <summary>
    /// Provides the entry point for the application
    /// </summary>
    public static class Program
    {
        /// <summary>
        /// The main entry point for the application.
        /// </summary>
        [STAThread]
        public static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            using (ServiceContainer container = new ServiceContainer())
            {
                Form mainView;

                ServiceProvider.Current = container;
                Service.RegisterServices(container);

                mainView = new Views.MainForm();
                Service.RegisterMainView(mainView);

                Application.Run(mainView);

                Properties.Settings.Default.Save();
            }
        }
    }
}
