//-----------------------------------------------------------------------
// <copyright file="Service.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.Design;
    using System.Linq;
    using System.Text;

    using Entities;
    using Services;
    using TechnologySolutions.ModelViewViewModel;
    using TechnologySolutions.ModelViewViewModel.Services;

    /// <summary>
    /// Provides application wide access to services
    /// </summary>
    public static class Service
    {
        public static void RegisterMainView(System.Windows.Forms.Form mainForm)
        {
            ((ControlDispatcher)ServiceProvider.Current.Get<IDispatcher>()).Control = mainForm;
        }

        /// <summary>
        /// Adds the services required by the application to the container
        /// </summary>
        public static void RegisterServices(IServiceContainer container)
        {
            CommandService commands;

            ServiceProvider.Current = container;
            container.AddService(typeof(IDispatcher), new ControlDispatcher());

            // common parameters holds parameters used accross many commands (e.g. output power)
            container.AddService(typeof(ICommonParameters), new CommonParameters(Properties.Settings.Default));

            // message service provide a way for application to route messages to the user interface
            container.AddService(typeof(MessageService), new MessageService());
            container.AddService(typeof(IMessageService), container.Get<MessageService>());

            // identifier cache builds a list of unique transponders and barcodes seen
            container.AddService(typeof(IdentifierCacheService), new IdentifierCacheService());
            container.AddService(typeof(IIdentifierCache), container.Get<IdentifierCacheService>());

            container.AddService(
                typeof(TechnologySolutions.Rfid.AsciiProtocol.DisplayResponder), 
                new TechnologySolutions.Rfid.AsciiProtocol.DisplayResponder());

            // File download responder captures a log file download
            // it is inserted in the top of the responder chain to capture a (potentially long) log file 
            // before any other responder is visited in the responder chain.
            // Added as a service as we want it disposed (to ensure any open file is closed) as the application terminates
            container.AddService(
                typeof(TechnologySolutions.Rfid.AsciiProtocol.FileDownloadResponder),
                new TechnologySolutions.Rfid.AsciiProtocol.FileDownloadResponder("LB", "LE"));

            // command and connect service handles setting up and communication with the UHF reader
            commands = new CommandService(
                container.Get<IMessageService>(),
                container.Get<IIdentifierCache>(),
                container.Get<TechnologySolutions.Rfid.AsciiProtocol.FileDownloadResponder>(),
                container.Get<TechnologySolutions.Rfid.AsciiProtocol.DisplayResponder>());
            container.AddService(typeof(IConnectionService), commands);
            container.AddService(typeof(ICommandService), commands);

            // register how to make view models for ViewModelLocator
            container.AddService(typeof(ViewModels.BarcodeViewModel), CreateViewModel);
            container.AddService(typeof(ViewModels.CommandsViewModel), CreateViewModel);
            container.AddService(typeof(ViewModels.CommonParametersViewModel), CreateViewModel);
            container.AddService(typeof(ViewModels.ConnectViewModel), CreateViewModel);
            container.AddService(typeof(ViewModels.InventoryViewModel), CreateViewModel);
            container.AddService(typeof(ViewModels.ReadWriteViewModel), CreateViewModel);
            container.AddService(typeof(ViewModels.ResponsesViewModel), CreateViewModel);
            container.AddService(typeof(ViewModels.SwitchActionViewModel), CreateViewModel);
            container.AddService(typeof(ViewModels.SwitchViewModel), CreateViewModel);
        }

        private static object CreateViewModel(IServiceProvider provider, Type viewModelType)
        {
            if (typeof(ViewModels.BarcodeViewModel).Equals(viewModelType))
            {
                return new ViewModels.BarcodeViewModel(
                    provider.Get<ICommandService>(),
                    provider.Get<IMessageService>(),
                    provider.Get<IIdentifierCache>());
            }
            else if (typeof(ViewModels.CommandsViewModel).Equals(viewModelType))
            {
                return new ViewModels.CommandsViewModel(
                    provider.Get<ICommandService>(),
                    provider.Get<IMessageService>());
            }
            else if (typeof(ViewModels.CommonParametersViewModel).Equals(viewModelType))
            {
                return new ViewModels.CommonParametersViewModel(
                    provider.Get <ICommonParameters >());
            }
            else if (typeof(ViewModels.ConnectViewModel).Equals(viewModelType))
            {
                return new ViewModels.ConnectViewModel(
                    provider.Get<IConnectionService>(),
                    Properties.Settings.Default);
            }
            else if (typeof(ViewModels.InventoryViewModel).Equals(viewModelType))
            {
                return new ViewModels.InventoryViewModel(
                    provider.Get<ICommandService>(),
                    provider.Get<IMessageService>(),
                    provider.Get<IIdentifierCache>(),
                    provider.Get<ICommonParameters>());
            }
            else if (typeof(ViewModels.ReadWriteViewModel).Equals(viewModelType))
            {
                return new ViewModels.ReadWriteViewModel(
                    provider.Get<ICommandService>(),
                    provider.Get<IMessageService>(),
                    provider.Get<IIdentifierCache>(),
                    provider.Get<ICommonParameters>());
            }
            else if (typeof(ViewModels.ResponsesViewModel).Equals(viewModelType))
            {
                return new ViewModels.ResponsesViewModel(
                    provider.Get<MessageService>(),
                    provider.Get<TechnologySolutions.Rfid.AsciiProtocol.DisplayResponder>(),
                    Properties.Settings.Default);
            }
            else if (typeof(ViewModels.SwitchActionViewModel).Equals(viewModelType))
            {
                return new ViewModels.SwitchActionViewModel(
                    provider.Get<ICommandService>());
            }
            else if (typeof(ViewModels.SwitchViewModel).Equals(viewModelType))
            {
                return new ViewModels.SwitchViewModel(
                    provider.Get<ICommandService>(),
                    provider.Get<IMessageService>());
            }
            else
            {
                throw new ArgumentException("do not know how to create an instance of " + viewModelType.FullName);
            }
        }
    }
}
